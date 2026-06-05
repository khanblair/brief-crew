export async function sendTelegramMessage(
  chatIdOrUsername: string,
  text: string
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatIdOrUsername.startsWith("@")
        ? chatIdOrUsername
        : `@${chatIdOrUsername}`,
      text,
      parse_mode: "HTML",
    }),
  });

  return res.ok;
}

export function buildClientNotification(params: {
  clientName: string;
  freelancerName: string;
  projectTitle: string;
  vercelUrl?: string;
  dashboardUrl: string;
}): string {
  const { clientName, freelancerName, projectTitle, vercelUrl, dashboardUrl } =
    params;

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
