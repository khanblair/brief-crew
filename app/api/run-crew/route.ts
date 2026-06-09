import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { runOrchestrator } from "@/lib/agents/orchestrator";
import { sendTelegramMessage, buildClientNotification } from "@/lib/telegram";
import type { RunContext, LogEntry } from "@/lib/agents/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const {
    projectId,
    briefText,
    clientName,
    clientCompany,
    clientEmail,
    clientTelegram,
    freelancerName,
    freelancerTitle,
    projectTitle,
  } = body;

  if (!briefText || !projectId) {
    return new Response("Missing required fields", { status: 400 });
  }

  const pid = projectId as Id<"projects">;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const emit = (entry: Omit<LogEntry, "id" | "timestamp">) => {
        send({
          id: Math.random().toString(36).slice(2),
          timestamp: Date.now(),
          ...entry,
        });
      };

      const startMs = Date.now();

      try {
        // ── 1. Mark project as running + create run record ───────────────────
        await fetchMutation(api.projects.updateStatus, { id: pid, status: "agents_running" });
        const runId = await fetchMutation(api.runs.createRun, { projectId: pid });

        const ctx: RunContext = {
          projectId,
          briefText,
          clientName,
          clientCompany,
          clientEmail,
          clientTelegram,
          freelancerName,
          freelancerTitle,
          projectTitle,
          emit,
        };

        // ── 2. Run all agents ────────────────────────────────────────────────
        const outputs = await runOrchestrator(ctx);
        const finishedAt = Date.now();
        const totalRuntime = finishedAt - startMs;

        // ── 3. Save agent outputs to Convex ──────────────────────────────────
        const saveAt = finishedAt;
        await Promise.all([
          outputs.research && fetchMutation(api.runs.saveOutput, {
            runId,
            projectId: pid,
            agentName: "research",
            startedAt: startMs,
            completedAt: saveAt,
            wordCount: outputs.research.trim().split(/\s+/).length,
            outputText: outputs.research,
            qualityCheck: "pass",
          }),
          outputs.brandCopy && fetchMutation(api.runs.saveOutput, {
            runId,
            projectId: pid,
            agentName: "writer",
            startedAt: startMs,
            completedAt: saveAt,
            wordCount: outputs.brandCopy.trim().split(/\s+/).length,
            outputText: outputs.brandCopy,
            qualityCheck: "pass",
          }),
          outputs.proposal && fetchMutation(api.runs.saveOutput, {
            runId,
            projectId: pid,
            agentName: "proposal",
            startedAt: startMs,
            completedAt: saveAt,
            wordCount: outputs.proposal.trim().split(/\s+/).length,
            outputText: outputs.proposal,
            qualityCheck: "pass",
          }),
          // Builder output: store the live URL as outputText
          outputs.landingPageUrl && fetchMutation(api.runs.saveOutput, {
            runId,
            projectId: pid,
            agentName: "builder",
            startedAt: startMs,
            completedAt: saveAt,
            wordCount: 1,
            outputText: outputs.landingPageUrl,
            qualityCheck: "pass",
          }),
        ].filter(Boolean));

        // ── 4. Complete the run record ────────────────────────────────────────
        await fetchMutation(api.runs.completeRun, {
          runId,
          totalRuntime,
          status: "complete",
        });

        // ── 5. Create package record ──────────────────────────────────────────
        await fetchMutation(api.packages.create, {
          projectId: pid,
          vercelUrl: outputs.landingPageUrl,
          htmlContent: outputs.landingPageHtml,
        });

        // ── 6. Mark project as package_ready ─────────────────────────────────
        await fetchMutation(api.projects.updateStatus, { id: pid, status: "package_ready" });

        // ── 7. Notify the client via Telegram ────────────────────────────────
        let clientChatId: string | null = clientTelegram ?? null;
        try {
          const clientUser = await fetchQuery(api.users.getByEmail, { email: clientEmail });
          if (clientUser?.telegramChatId) clientChatId = clientUser.telegramChatId;
        } catch { /* non-fatal */ }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://brief-crew.vercel.app";
        const sendResult = await sendTelegramMessage(
          { chatId: clientChatId },
          buildClientNotification({
            clientName,
            freelancerName,
            projectTitle,
            vercelUrl: outputs.landingPageUrl,
            dashboardUrl: `${appUrl}/my-projects`,
          })
        );

        // Update package telegram status
        const pkg = await fetchQuery(api.packages.getByProject, { projectId: pid });
        if (pkg) {
          await fetchMutation(api.packages.updateTelegramStatus, {
            packageId: pkg._id,
            status: sendResult === "sent" ? "sent" : sendResult === "no_recipient" ? "skipped" : "failed",
          });
        }

        if (sendResult === "no_recipient") {
          emit({ agent: "Telegram", status: "complete", message: "No client Telegram configured — skipping" });
        } else if (sendResult !== "sent") {
          emit({ agent: "Telegram", status: "error", message: `Telegram notification failed (${sendResult})` });
        } else {
          emit({ agent: "Telegram", status: "complete", message: "Client notified via Telegram ✓" });
        }

        send({ type: "complete", outputs });

      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        emit({ agent: "Orchestrator", status: "error", message: `Fatal error: ${message}` });

        // Best-effort: mark project as brief_submitted so it can be retried
        try {
          await fetchMutation(api.projects.updateStatus, { id: pid, status: "brief_submitted" });
        } catch { /* ignore */ }

        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
