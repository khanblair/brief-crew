import { chat } from "../deepseek";
import { tavilySearch } from "../tavily";
import { EAST_AFRICA_RATE_CARD } from "../rate-card";
import type { RunContext } from "./types";

/** Try to extract an hourly rate range (USD) from Tavily search snippets via LLM */
async function extractRateFromSnippets(
  skill: string,
  snippets: string[]
): Promise<{ min: number; max: number } | null> {
  if (!snippets.length) return null;
  const raw = await chat([
    {
      role: "system",
      content: `You are a compensation data analyst. Extract the hourly rate range in USD for a "${skill}" freelancer in East Africa (Uganda, Kenya, Tanzania, Rwanda) from the snippets below.
Return ONLY a JSON object: { "min": <number>, "max": <number> }
If no rate is mentioned or the data is not specific to East Africa, return null.
Do not guess — return null if unsure.`,
    },
    {
      role: "user",
      content: snippets.join("\n\n---\n\n"),
    },
  ], { temperature: 0.1 });

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match?.[0] ?? "null");
    if (parsed && typeof parsed.min === "number" && typeof parsed.max === "number") {
      return parsed as { min: number; max: number };
    }
  } catch { /* fall through */ }
  return null;
}

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
Break the project into discrete components based on the brief. Return a JSON array of objects:
{ component, skill_category, hours_optimistic, hours_realistic, hours_conservative }

Skill categories must exactly match one of: ${Object.keys(EAST_AFRICA_RATE_CARD).join(", ")}
Tailor the component breakdown to the actual project described — do not use generic components if the brief specifies otherwise.`,
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
    // Fallback stays generic but is clearly labelled as a default
    scope = [
      { component: "Mobile Application", skill_category: "React Native Developer", hours_optimistic: 120, hours_realistic: 160, hours_conservative: 200 },
      { component: "Backend API", skill_category: "Backend API Developer", hours_optimistic: 80, hours_realistic: 120, hours_conservative: 150 },
      { component: "Database", skill_category: "Database Engineer", hours_optimistic: 30, hours_realistic: 50, hours_conservative: 70 },
      { component: "QA & Testing", skill_category: "QA Engineer", hours_optimistic: 40, hours_realistic: 60, hours_conservative: 80 },
      { component: "DevOps & Deployment", skill_category: "DevOps Engineer", hours_optimistic: 20, hours_realistic: 35, hours_conservative: 50 },
      { component: "Project Management", skill_category: "Project Manager", hours_optimistic: 30, hours_realistic: 45, hours_conservative: 60 },
    ];
  }

  emit({ agent: "Proposal Agent", status: "complete", message: `Scope decomposition — ${scope.length} components` });

  // ── Rate research: actually use the Tavily data ──────────────────────────
  const liveRates: Record<string, { min: number; max: number; source: string }> = {};
  const uniqueSkills = [...new Set(scope.map((s) => s.skill_category))];

  for (const skill of uniqueSkills) {
    const query = `"${skill}" freelance hourly rate East Africa Uganda Kenya 2024 2025`;
    const startMs = Date.now();
    emit({ agent: "Proposal Agent", status: "running", message: `Rate research: "${skill}"` });

    try {
      const { results } = await tavilySearch(query, { maxResults: 4 });
      const elapsed = Date.now() - startMs;

      const snippets = results.map((r) => `${r.title}\n${r.content}`);
      const extracted = await extractRateFromSnippets(skill, snippets);

      if (extracted) {
        liveRates[skill] = {
          min: extracted.min,
          max: extracted.max,
          source: results[0]?.url ?? "tavily-search",
        };
        emit({
          agent: "Proposal Agent",
          status: "complete",
          message: `Rate found: $${extracted.min}–$${extracted.max}/hr [live data]`,
          elapsed,
        });
      } else {
        // Tavily returned results but no rate could be extracted — use internal benchmark
        const fallback = EAST_AFRICA_RATE_CARD[skill as keyof typeof EAST_AFRICA_RATE_CARD] ?? { min: 20, max: 40 };
        liveRates[skill] = {
          min: fallback.min,
          max: fallback.max,
          source: "BriefCrew internal benchmark",
        };
        emit({
          agent: "Proposal Agent",
          status: "complete",
          message: `No live rate found for "${skill}" — using internal benchmark ($${fallback.min}–$${fallback.max}/hr)`,
          elapsed,
        });
      }
    } catch {
      const fallback = EAST_AFRICA_RATE_CARD[skill as keyof typeof EAST_AFRICA_RATE_CARD] ?? { min: 20, max: 40 };
      liveRates[skill] = {
        min: fallback.min,
        max: fallback.max,
        source: "BriefCrew internal benchmark (search failed)",
      };
    }
  }

  emit({ agent: "Proposal Agent", status: "running", message: "Calculating budget..." });

  let totalMin = 0, totalMax = 0;
  const lineItems = scope.map((item) => {
    const rate = liveRates[item.skill_category] ?? { min: 20, max: 40 };
    const costMin = item.hours_realistic * rate.min;
    const costMax = item.hours_realistic * rate.max;
    totalMin += costMin;
    totalMax += costMax;
    return { ...item, rateMin: rate.min, rateMax: rate.max, costMin, costMax, rateSource: liveRates[item.skill_category]?.source ?? "internal" };
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
    message: `Budget: $${grandTotalMin.toLocaleString()}–$${grandTotalMax.toLocaleString()} (midpoint $${midpoint.toLocaleString()})`,
  });

  emit({ agent: "Proposal Agent", status: "running", message: "Writing proposal document..." });

  const proposal = await chat([
    {
      role: "system",
      content: `You are a senior business development consultant producing a professional project proposal.
Write a complete proposal document with these sections:
1. Executive Summary
2. Scope of Work (reference the actual brief details)
3. Recommended Team Structure
4. Phased Timeline (weeks, based on realistic hours)
5. Budget Breakdown (markdown table with columns: Component | Hours | Rate/hr | Cost Range | Rate Source)
6. Payment Milestone Schedule
7. Terms & Next Steps

Be specific to the actual project. Do not write generic placeholders.
In the Budget table, include the Rate Source column so the client can see where rates came from.`,
    },
    {
      role: "user",
      content: `Client: ${ctx.clientName} — ${ctx.clientCompany}
Brief: ${ctx.briefText}
Prepared by: ${ctx.freelancerName}, ${ctx.freelancerTitle}
Research context: ${researchReport.slice(0, 1500)}

Budget data (verified rates):
${lineItems.map((i) => `- ${i.component} (${i.skill_category}): ${i.hours_realistic}hrs @ $${i.rateMin}–$${i.rateMax}/hr = $${i.costMin.toLocaleString()}–$${i.costMax.toLocaleString()} [${i.rateSource}]`).join("\n")}
PM overhead (15%): $${pmOverheadMin.toLocaleString()}–$${pmOverheadMax.toLocaleString()}
Contingency (10%): $${contingencyMin.toLocaleString()}–$${contingencyMax.toLocaleString()}
TOTAL: $${grandTotalMin.toLocaleString()}–$${grandTotalMax.toLocaleString()}
Recommended midpoint: $${midpoint.toLocaleString()}

Write the full proposal document now.`,
    },
  ], { temperature: 0.4, maxTokens: 3000 });

  const wordCount = proposal.trim().split(/\s+/).length;
  emit({ agent: "Proposal Agent", status: "complete", message: `Proposal complete — ${wordCount} words` });

  return proposal;
}
