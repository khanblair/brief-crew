import { auth } from "@clerk/nextjs/server";
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

        if (clientTelegram) {
          await sendTelegramMessage(
            clientTelegram,
            buildClientNotification({
              clientName,
              freelancerName,
              projectTitle,
              vercelUrl: outputs.landingPageUrl,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://brief-crew.vercel.app"}/my-projects`,
            })
          );
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
