import { execSync } from "child_process";

export type TelegramRecipient = {
  /** Confirmed chat_id from /start handshake — always works. */
  chatId?: string | null;
  /** @username fallback — only works if user has /start'd the bot. */
  username?: string | null;
};

export type SendResult =
  | "sent"
  | "no_recipient"
  | "network_error"   // TCP/DNS failure reaching api.telegram.org
  | "bot_rejected"    // HTTP 4xx from Telegram (bad token, chat not found, etc.)
  | "failed";         // unexpected error

const MAX_ATTEMPTS = 2;

/**
 * Send a message via the app's bot using curl (reliable across all environments).
 * Falls back to Node fetch on systems without curl.
 * Prefers chatId (confirmed) over @username (requires prior /start).
 */
export async function sendTelegramMessage(
  recipient: TelegramRecipient,
  text: string
): Promise<SendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[telegram] TELEGRAM_BOT_TOKEN not set — skipping");
    return "failed";
  }

  const chatId = recipient.chatId ?? (
    recipient.username
      ? (recipient.username.startsWith("@") ? recipient.username : `@${recipient.username}`)
      : null
  );

  if (!chatId) return "no_recipient";

  const payload = JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" });
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const result = await trySend(url, payload, attempt);
    if (result === "sent") return "sent";
    if (result === "bot_rejected") return "bot_rejected";
    if (result === "network_error" && attempt < MAX_ATTEMPTS) {
      console.warn(`[telegram] attempt ${attempt} network error — retrying…`);
      continue;
    }
    return result;
  }

  return "failed";
}

async function trySend(
  url: string,
  payload: string,
  attempt: number
): Promise<SendResult> {
  // ── curl path (preferred — no undici connection issues) ──────────────────
  // Payload is passed via stdin (-d @-) so newlines/special chars are safe.
  try {
    // disable_web_page_preview stops Telegram appending a link preview to messages
    const payloadWithOptions = JSON.stringify({
      ...JSON.parse(payload),
      disable_web_page_preview: true,
    });
    const out = execSync(
      `curl -s -w "\\n%{http_code}" --max-time 30 -X POST "${url}" ` +
      `-H "Content-Type: application/json" -d @-`,
      { timeout: 35_000, encoding: "utf8", input: payloadWithOptions }
    );
    const lines  = out.trim().split("\n");
    const status = parseInt(lines[lines.length - 1], 10);
    const body   = lines.slice(0, -1).join("\n");

    if (status >= 200 && status < 300) return "sent";
    if (status >= 400 && status < 500) {
      console.warn(`[telegram] curl HTTP ${status}:`, body);
      return "bot_rejected";
    }
    console.warn(`[telegram] curl HTTP ${status} on attempt ${attempt}:`, body);
    return "network_error";
  } catch (curlErr) {
    console.warn(`[telegram] curl attempt ${attempt} failed:`, (curlErr as Error).message);
  }

  // ── Node fetch fallback (if curl unavailable) ────────────────────────────
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);

    const bodyWithOptions = JSON.stringify({
      ...JSON.parse(payload),
      disable_web_page_preview: true,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Connection: "close" },
      body: bodyWithOptions,
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) return "sent";

    const err = await res.text().catch(() => "(unreadable)");
    console.warn(`[telegram] fetch HTTP ${res.status} on attempt ${attempt}:`, err);
    return res.status >= 400 && res.status < 500 ? "bot_rejected" : "network_error";
  } catch (fetchErr: unknown) {
    const msg =
      fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    const cause =
      fetchErr instanceof Error && "cause" in fetchErr
        ? (fetchErr as { cause?: { message?: string } }).cause?.message ?? ""
        : "";
    const isNetwork =
      msg.includes("fetch failed") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("ENOTFOUND") ||
      (fetchErr instanceof Error && fetchErr.name === "AbortError") ||
      cause.includes("Connect Timeout") ||
      cause.includes("UND_ERR");

    console.warn(`[telegram] fetch attempt ${attempt} error:`, msg, cause);
    return isNetwork ? "network_error" : "failed";
  }
}

export function buildClientNotification(params: {
  clientName: string;
  freelancerName: string;
  projectTitle: string;
  vercelUrl?: string;
  dashboardUrl: string;
}): string {
  const { clientName, freelancerName, projectTitle, vercelUrl, dashboardUrl } = params;

  return `🎯 <b>Your BriefCrew Package Is Ready</b>

Hi ${clientName},

<b>${freelancerName}</b> has completed your engagement package for <b>${projectTitle}</b>.

Your package includes:
📊 Market Research Report
✍️ Brand Copy &amp; Tagline Options
🌐 Landing Page${vercelUrl ? ` — live at: ${vercelUrl}` : ""}
📋 Pitch Deck Outline (10 slides)
💼 Priced Project Proposal

Log in to view and download your package:
${dashboardUrl}

<i>Delivered by BriefCrew · The Agentic Freelancer System</i>`;
}

export function buildFreelancerNotification(params: {
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  briefExcerpt: string;
  dashboardUrl: string;
}): string {
  const { clientName, clientCompany, clientEmail, briefExcerpt, dashboardUrl } = params;

  return `📩 <b>New brief received via BriefCrew</b>

<b>From:</b> ${clientName} (${clientCompany})
<b>Email:</b> ${clientEmail}
<b>Brief:</b> ${briefExcerpt}

<a href="${dashboardUrl}">Open your dashboard to review and run the crew →</a>`;
}
