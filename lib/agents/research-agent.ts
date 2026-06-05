import { chat } from "../deepseek";
import { tavilySearch, tavilyExtract } from "../tavily";
import type { RunContext } from "./types";

export async function runResearchAgent(ctx: RunContext): Promise<string> {
  const emit = ctx.emit;

  emit({ agent: "Research Agent", status: "running", message: "Generating search queries from brief..." });

  const queriesRaw = await chat([
    {
      role: "system",
      content:
        "You are a market research specialist focused on East African markets. Generate exactly 5 targeted search queries for the given brief. Return only a JSON array of strings. Queries should target regional data from GSMA, FSD Africa, central banks, and fintech research firms.",
    },
    {
      role: "user",
      content: `Brief: ${ctx.briefText}\n\nClient: ${ctx.clientCompany} — ${ctx.clientName}\n\nGenerate 5 search queries.`,
    },
  ]);

  let queries: string[] = [];
  try {
    const match = queriesRaw.match(/\[[\s\S]*\]/);
    queries = JSON.parse(match?.[0] ?? "[]");
  } catch {
    queries = [
      `${ctx.clientCompany} market East Africa 2025`,
      `fintech adoption Uganda Kenya 2025 statistics`,
      `mobile money East Africa market size 2025`,
      `${ctx.clientCompany} competitors East Africa`,
      `East Africa startup ecosystem funding 2025`,
    ];
  }

  emit({ agent: "Research Agent", status: "complete", message: `${queries.length} queries generated` });

  const allResults: string[] = [];
  let totalSearches = 0;

  for (const query of queries) {
    const startMs = Date.now();
    emit({ agent: "Research Agent", status: "running", message: `Tavily search: "${query}"` });

    try {
      const { results } = await tavilySearch(query, { maxResults: 5 });
      totalSearches++;
      const elapsed = Date.now() - startMs;
      emit({
        agent: "Research Agent",
        status: "complete",
        message: `${results.length} results returned`,
        elapsed,
      });

      for (const result of results.slice(0, 2)) {
        emit({ agent: "Research Agent", status: "running", message: `Fetching full article: ${result.url}` });
        try {
          const content = await tavilyExtract(result.url);
          if (content) {
            allResults.push(`SOURCE: ${result.url}\nTITLE: ${result.title}\n${content.slice(0, 2000)}`);
            emit({ agent: "Research Agent", status: "complete", message: `Article read — data points extracted` });
          }
        } catch {
          allResults.push(`SOURCE: ${result.url}\nTITLE: ${result.title}\n${result.content}`);
        }
      }

      for (const result of results.slice(2)) {
        allResults.push(`SOURCE: ${result.url}\nTITLE: ${result.title}\n${result.content}`);
      }
    } catch {
      emit({ agent: "Research Agent", status: "error", message: `Search failed for: "${query}" — skipping` });
    }
  }

  emit({ agent: "Research Agent", status: "running", message: "Synthesising findings into report..." });

  const report = await chat([
    {
      role: "system",
      content: `You are a senior market research analyst specialising in East African markets.
Write a grounded, cited market research report of 700-900 words.
Structure: Executive Summary, Market Size and Adoption, Competitive Landscape, Regulatory Environment, Target Audience Profile, Opportunity Analysis, Sources.
CRITICAL: Use only East African data. Flag and exclude Western-skewed statistics. Every claim must cite its source URL.
No hallucinated figures. If data is unavailable, state this explicitly.`,
    },
    {
      role: "user",
      content: `Brief: ${ctx.briefText}

Client: ${ctx.clientCompany}

Research Sources:
${allResults.join("\n\n---\n\n")}

Write the market research report now.`,
    },
  ], { temperature: 0.3, maxTokens: 2000 });

  const wordCount = report.trim().split(/\s+/).length;
  emit({ agent: "Research Agent", status: "complete", message: `Market research report complete — ${wordCount} words` });

  return report;
}
