import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Allow an explicit chatId override (e.g. testing before saving)
  let overrideChatId: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body?.chatId) overrideChatId = String(body.chatId).trim();
  } catch { /* no body — fine */ }

  const chatId = overrideChatId ?? (
    await fetchQuery(api.users.getTelegramRecipient, { clerkId: userId })
      .then((r) => r?.chatId ?? null)
      .catch(() => null)
  );

  if (!chatId) return Response.json({ ok: false, reason: "no_recipient" });

  const result = await sendTelegramMessage(
    { chatId },
    `🔔 <b>BriefCrew — test notification</b>\n\nYour Telegram notifications are working correctly. ✅`
  );

  return Response.json({ ok: result === "sent", reason: result });
}
