import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendTelegramMessage, buildFreelancerNotification } from "@/lib/telegram";

export async function POST(req: Request) {
  const {
    clientName,
    clientCompany,
    clientEmail,
    clientTelegram,
    briefText,
    freelancerClerkId,
    freelancerUsername,
  } = await req.json();

  if (!clientName || !clientCompany || !clientEmail || !briefText || !freelancerClerkId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const wordCount = briefText.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 30) {
    return Response.json({ error: "Brief must be at least 30 words" }, { status: 400 });
  }

  try {
    await fetchMutation(api.projects.createFromPublicForm, {
      freelancerId: freelancerClerkId,
      clientName,
      clientCompany,
      clientEmail,
      clientTelegram: clientTelegram || undefined,
      briefText,
    });

    // Server-side lookup of freelancer's Telegram — no client header needed
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://brief-crew.vercel.app";
      const freelancer = await fetchQuery(api.users.getTelegramRecipient, {
        clerkId: freelancerClerkId,
      });

      if (freelancer?.chatId) {
        await sendTelegramMessage(
          { chatId: freelancer.chatId },
          buildFreelancerNotification({
            clientName,
            clientCompany,
            clientEmail,
            briefExcerpt: briefText.slice(0, 300) + (briefText.length > 300 ? "…" : ""),
            dashboardUrl: `${appUrl}/dashboard`,
          })
        );
      }
    } catch {
      // Telegram notification is best-effort — never block submission
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
