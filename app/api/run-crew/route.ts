import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
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
    clientTelegram,   // @username from the project record (fallback)
    freelancerName,
    freelancerTitle,
    projectTitle,
  } = body;

  if (!briefText || !projectId) {
    return new Response("Missing required fields", { status: 400 });
  }

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

      try {
        const outputs = await runOrchestrator(ctx);

        // Resolve the client's chat_id:
        // 1. Look up registered user by email (most reliable — confirmed via settings)
        // 2. Fall back to chat ID entered in the brief form / new project form
        let clientChatId: string | null = clientTelegram ?? null;

        try {
          const clientUser = await fetchQuery(api.users.getByEmail, { email: clientEmail });
          if (clientUser?.telegramChatId) clientChatId = clientUser.telegramChatId;
        } catch {
          // Non-fatal
        }

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

        if (sendResult === "no_recipient") {
          emit({
            agent: "Telegram",
            status: "complete",
            message: "No client Telegram configured — skipping notification",
          });
        } else if (sendResult === "failed") {
          emit({
            agent: "Telegram",
            status: "error",
            message: "Telegram notification failed — client may not have /start'd the bot yet",
          });
        } else {
          emit({ agent: "Telegram", status: "complete", message: "Client notified via Telegram ✓" });
        }

        send({ type: "complete", outputs });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        emit({ agent: "Orchestrator", status: "error", message: `Fatal error: ${message}` });
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
