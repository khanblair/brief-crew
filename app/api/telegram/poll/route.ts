/**
 * Poll Telegram for pending /start commands and save chat_ids to Convex.
 *
 * Use this in local dev where Telegram can't POST to localhost.
 * On production the webhook handles this automatically.
 *
 * POST /api/telegram/poll
 */

import { execSync } from "child_process";
import { fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return Response.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });

  // Use curl — reliable, no undici connection issues
  let raw: string;
  try {
    raw = execSync(
      `curl -s --max-time 30 "https://api.telegram.org/bot${token}/getUpdates?limit=20"`,
      { timeout: 35_000, encoding: "utf8" }
    );
  } catch (e) {
    return Response.json({ error: "curl failed: " + (e as Error).message }, { status: 500 });
  }

  let data: { ok: boolean; result?: TelegramUpdate[]; description?: string };
  try {
    data = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Bad response from Telegram", raw }, { status: 500 });
  }

  if (!data.ok) {
    return Response.json({ error: data.description ?? "Telegram error" }, { status: 500 });
  }

  const processed: { clerkId: string; chatId: string; username?: string }[] = [];
  const skipped:   { text: string; reason: string }[] = [];

  for (const update of data.result ?? []) {
    const msg = update.message;
    if (!msg?.text?.startsWith("/start")) {
      skipped.push({ text: msg?.text ?? "(no text)", reason: "not a /start command" });
      continue;
    }

    const parts   = msg.text.trim().split(/\s+/);
    const clerkId = parts[1];
    const chatId  = String(msg.chat.id);

    if (!clerkId) {
      skipped.push({ text: msg.text, reason: "no clerkId in /start payload" });
      continue;
    }

    try {
      await fetchMutation(api.users.updateTelegramChatId, { clerkId, chatId });

      await sendTelegramMessage(
        { chatId },
        `✅ <b>Telegram connected!</b>\n\nYou'll now receive BriefCrew notifications here.`
      );

      processed.push({ clerkId, chatId, username: msg.from?.username });
    } catch (err) {
      skipped.push({ text: msg.text, reason: (err as Error).message });
    }
  }

  return Response.json({ ok: true, processed, skipped });
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    from?: { id: number; username?: string };
    text?: string;
  };
}
