import { auth } from "@clerk/nextjs/server";
import { chat } from "@/lib/deepseek";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { briefText } = await req.json();

  if (!briefText || briefText.trim().split(/\s+/).length < 50) {
    return Response.json({
      valid: false,
      message: "Brief must be at least 50 words.",
      deliverables: [],
    });
  }

  try {
    const raw = await chat([
      {
        role: "system",
        content: `Analyze the brief and identify which of these 5 deliverables are needed:
1. Market Research Report → Research Agent
2. Brand Copy & Tagline → Writer Agent
3. Landing Page → Builder Agent
4. Pitch Deck Outline → Writer Agent
5. Priced Project Proposal → Proposal Agent

Return JSON: { deliverables: [{ name, agent }], estimatedRuntime: "X-Y minutes" }
If the brief is too vague, return { valid: false, message: "..." }`,
      },
      { role: "user", content: briefText },
    ], { temperature: 0.2 });

    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? "{}");
    return Response.json({ valid: true, ...parsed });
  } catch {
    return Response.json({
      valid: true,
      deliverables: [
        { name: "Market Research Report", agent: "Research Agent" },
        { name: "Brand Copy & Tagline", agent: "Writer Agent" },
        { name: "Landing Page", agent: "Builder Agent" },
        { name: "Pitch Deck Outline", agent: "Writer Agent" },
        { name: "Priced Project Proposal", agent: "Proposal Agent" },
      ],
      estimatedRuntime: "3-5 minutes",
    });
  }
}
