/**
 * Telegram bot webhook.
 *
 * Telegram sends POST requests here whenever someone messages the bot.
 * We only act on /start <clerkId> — this is the "Connect Telegram" handshake.
 *
 * After calling this once, the user's telegramChatId is saved and all future
 * notifications use the numeric chat_id (always works, unlike @username).
 *
 * Register this webhook once with:
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram/webhook&secret_token=<WEBHOOK_SECRET>"
 */

import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  // Validate the secret token Telegram sends in the header
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers.get("x-telegram-bot-api-secret-token");
    if (incoming !== secret) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const message = update.message;
  if (!message) return new Response("OK");

  const chatId = String(message.chat.id);
  const text   = message.text ?? "";

  // Only handle /start <clerkId>
  if (text.startsWith("/start")) {
    const parts   = text.trim().split(/\s+/);
    const clerkId = parts[1]; // may be undefined if user just sends /start

    if (clerkId) {
      try {
        await fetchMutation(api.users.updateTelegramChatId, { clerkId, chatId });

        await sendTelegramMessage(
          { chatId },
          `✅ <b>Telegram connected!</b>\n\nYou'll now receive BriefCrew notifications here. No further action needed.`
        );
      } catch (err) {
        console.error("[telegram/webhook] failed to save chatId:", err);
        await sendTelegramMessage(
          { chatId },
          `⚠️ Could not link your account. Please return to BriefCrew settings and try again.`
        );
      }
    } else {
      // Generic /start without a clerkId — user opened the bot directly
      await sendTelegramMessage(
        { chatId },
        `👋 <b>Welcome to BriefCrew!</b>\n\nTo receive notifications, go to your BriefCrew settings and click <b>Connect Telegram</b>. That link will bring you back here with your account linked automatically.`
      );
    }
  }

  return new Response("OK");
}

// Minimal Telegram update types
interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    from?: { id: number; username?: string };
    text?: string;
  };
}
