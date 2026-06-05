import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  const { clientName, clientCompany, clientEmail, briefText, freelancerClerkId, freelancerUsername } =
    await req.json();

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
      briefText,
    });

    // Fetch freelancer's Telegram to notify them
    // We do a best-effort notification — failure doesn't block the response
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const message =
        `📩 <b>New brief received via BriefCrew</b>\n\n` +
        `<b>From:</b> ${clientName} (${clientCompany})\n` +
        `<b>Email:</b> ${clientEmail}\n` +
        `<b>Brief:</b> ${briefText.slice(0, 300)}${briefText.length > 300 ? "..." : ""}\n\n` +
        `<a href="${appUrl}/dashboard">Open your dashboard to review and run the crew →</a>`;

      // Look up the freelancer's Telegram from the database via a direct Convex query
      // We pass it as a header hint from the client page if available
      const telegramUsername = req.headers.get("x-freelancer-telegram");
      if (telegramUsername) {
        await sendTelegramMessage(telegramUsername, message);
      }
    } catch {
      // Telegram notification is best-effort — don't block submission
    }

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
