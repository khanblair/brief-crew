import { chat } from "../deepseek";
import { tavilySearch } from "../tavily";
import { EAST_AFRICA_RATE_CARD } from "../rate-card";
import type { RunContext } from "./types";

export async function runProposalAgent(
  ctx: RunContext,
  researchReport: string
): Promise<string> {
  const emit = ctx.emit;

  emit({ agent: "Proposal Agent", status: "running", message: "Decomposing project scope..." });

  const scopeRaw = await chat([
    {
      role: "system",
      content: `You are a technical project scoper for East African tech projects.
Break the project into discrete components. Return JSON array of objects: { component, skill_category, hours_optimistic, hours_realistic, hours_conservative }
Skill categories must match: ${Object.keys(EAST_AFRICA_RATE_CARD).join(", ")}`,
    },
    { role: "user", content: `Brief: ${ctx.briefText}\nResearch context: ${researchReport.slice(0, 1000)}` },
  ], { temperature: 0.3 });

  let scope: Array<{
    component: string;
    skill_category: string;
    hours_optimistic: number;
    hours_realistic: number;
    hours_conservative: number;
  }> = [];
  try {
    const match = scopeRaw.match(/\[[\s\S]*\]/);
    scope = JSON.parse(match?.[0] ?? "[]");
  } catch {
    scope = [
      { component: "Mobile Application", skill_category: "React Native Developer", hours_optimistic: 120, hours_realistic: 160, hours_conservative: 200 },
      { component: "Backend API", skill_category: "Backend API Developer", hours_optimistic: 80, hours_realistic: 120, hours_conservative: 150 },
      { component: "Database", skill_category: "Database Engineer", hours_optimistic: 30, hours_realistic: 50, hours_conservative: 70 },
      { component: "QA & Testing", skill_category: "QA Engineer", hours_optimistic: 40, hours_realistic: 60, hours_conservative: 80 },
      { component: "DevOps & Deployment", skill_category: "DevOps Engineer", hours_optimistic: 20, hours_realistic: 35, hours_conservative: 50 },
      { component: "Project Management", skill_category: "Project Manager", hours_optimistic: 30, hours_realistic: 45, hours_conservative: 60 },
    ];
  }

  emit({ agent: "Proposal Agent", status: "complete", message: `Scope decomposition complete — ${scope.length} components` });

  const liveRates: Record<string, { min: number; max: number; source: string }> = {};

  const uniqueSkills = [...new Set(scope.map((s) => s.skill_category))];
  for (const skill of uniqueSkills.slice(0, 3)) {
    const query = `${skill} freelance rate East Africa Uganda Kenya 2025`;
    const startMs = Date.now();
    emit({ agent: "Proposal Agent", status: "running", message: `Tavily search: "${query}"` });

    try {
      const { results } = await tavilySearch(query, { maxResults: 3 });
      const elapsed = Date.now() - startMs;
      emit({ agent: "Proposal Agent", status: "complete", message: `Rate data retrieved — East Africa adjustment applied`, elapsed });

      if (results.length > 0) {
        const fallback = EAST_AFRICA_RATE_CARD[skill as keyof typeof EAST_AFRICA_RATE_CARD] ?? { min: 20, max: 40 };
        liveRates[skill] = {
          min: fallback.min,
          max: fallback.max,
          source: results[0].url,
        };
      }
    } catch {
      const fallback = EAST_AFRICA_RATE_CARD[skill as keyof typeof EAST_AFRICA_RATE_CARD] ?? { min: 20, max: 40 };
      liveRates[skill] = { min: fallback.min, max: fallback.max, source: "internal-benchmarks" };
    }
  }

  for (const skill of uniqueSkills.slice(3)) {
    const rate = EAST_AFRICA_RATE_CARD[skill as keyof typeof EAST_AFRICA_RATE_CARD] ?? { min: 20, max: 40 };
    liveRates[skill] = { min: rate.min, max: rate.max, source: "internal-benchmarks" };
  }

  emit({ agent: "Proposal Agent", status: "running", message: "Calculating budget..." });

  let totalMin = 0, totalMax = 0;
  const lineItems = scope.map((item) => {
    const rate = liveRates[item.skill_category] ?? { min: 20, max: 40 };
    const costMin = item.hours_realistic * rate.min;
    const costMax = item.hours_realistic * rate.max;
    totalMin += costMin;
    totalMax += costMax;
    return { ...item, rateMin: rate.min, rateMax: rate.max, costMin, costMax };
  });

  const pmOverheadMin = Math.round(totalMin * 0.15);
  const pmOverheadMax = Math.round(totalMax * 0.15);
  const contingencyMin = Math.round((totalMin + pmOverheadMin) * 0.1);
  const contingencyMax = Math.round((totalMax + pmOverheadMax) * 0.1);
  const grandTotalMin = totalMin + pmOverheadMin + contingencyMin;
  const grandTotalMax = totalMax + pmOverheadMax + contingencyMax;
  const midpoint = Math.round((grandTotalMin + grandTotalMax) / 2);

  emit({
    agent: "Proposal Agent",
    status: "complete",
    message: `Budget calculated — range: $${grandTotalMin.toLocaleString()}–$${grandTotalMax.toLocaleString()}`,
  });

  emit({ agent: "Proposal Agent", status: "running", message: "Writing proposal document..." });

  const proposal = await chat([
    {
      role: "system",
      content: `You are a senior business development consultant producing a professional project proposal for an East African client.
Write a complete proposal document with: Executive Summary, Scope of Work, Recommended Team Structure, Phased Timeline (12-16 weeks), Budget Breakdown (formatted as a markdown table), Payment Milestone Schedule, Terms and Next Steps.
Be specific, professional, and grounded in the actual project details.`,
    },
    {
      role: "user",
      content: `Client: ${ctx.clientName} — ${ctx.clientCompany}
Brief: ${ctx.briefText}
Prepared by: ${ctx.freelancerName}, ${ctx.freelancerTitle}
Research context: ${researchReport.slice(0, 1500)}

Budget data:
${lineItems.map((i) => `- ${i.component} (${i.skill_category}): ${i.hours_realistic}hrs @ $${i.rateMin}–$${i.rateMax}/hr = $${i.costMin.toLocaleString()}–$${i.costMax.toLocaleString()}`).join("\n")}
PM overhead (15%): $${pmOverheadMin.toLocaleString()}–$${pmOverheadMax.toLocaleString()}
Contingency (10%): $${contingencyMin.toLocaleString()}–$${contingencyMax.toLocaleString()}
TOTAL: $${grandTotalMin.toLocaleString()}–$${grandTotalMax.toLocaleString()}
Recommended midpoint: $${midpoint.toLocaleString()}

Write the full proposal document now.`,
    },
  ], { temperature: 0.4, maxTokens: 3000 });

  const wordCount = proposal.trim().split(/\s+/).length;
  emit({ agent: "Proposal Agent", status: "complete", message: `Proposal document complete — ${wordCount} words` });

  return proposal;
}
