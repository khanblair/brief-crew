import { chat } from "../deepseek";
import { tavilySearch, tavilyExtract } from "../tavily";
import type { RunContext } from "./types";

export async function runResearchAgent(ctx: RunContext): Promise<string> {
  const emit = ctx.emit;

  emit({ agent: "Research Agent", status: "running", message: "Generating search queries from brief..." });

  const queriesRaw = await chat([
    {
      role: "system",
      content: `You are a market research specialist. Read the brief and generate exactly 5 targeted search queries that will surface:
1. Market size and adoption data for the product/service described
2. Competitor landscape relevant to the geography mentioned
3. Regulatory or compliance environment for this product type
4. Pricing benchmarks or willingness-to-pay data
5. Recent news or funding rounds in this space

Rules:
- Tailor queries to the actual product and geography in the brief — do NOT default to fintech if the brief is about something else
- Prefer queries that will return data from research firms, government sources, or reputable news (e.g. site:gsma.com OR site:worldbank.org OR site:techcrunch.com)
- Return ONLY a JSON array of 5 strings, nothing else`,
    },
    {
      role: "user",
      content: `Brief: ${ctx.briefText}\n\nClient: ${ctx.clientCompany} (${ctx.clientName})`,
    },
  ]);

  let queries: string[] = [];
  try {
    const match = queriesRaw.match(/\[[\s\S]*\]/);
    queries = JSON.parse(match?.[0] ?? "[]");
  } catch { /* ignore */ }

  // Fallback: derive generic queries from brief text rather than hardcoding fintech
  if (!queries.length || queries.some((q) => typeof q !== "string")) {
    const words = ctx.briefText.trim().split(/\s+/).slice(0, 10).join(" ");
    queries = [
      `${ctx.clientCompany} market size 2024 2025`,
      `${words} competitors market analysis`,
      `${ctx.clientCompany} industry growth Africa 2025`,
      `${words} pricing model revenue`,
      `${ctx.clientCompany} funding investment news`,
    ];
  }

  emit({ agent: "Research Agent", status: "complete", message: `${queries.length} queries generated` });

  const allResults: string[] = [];
  let totalSearches = 0;

  for (const query of queries) {
    const startMs = Date.now();
    emit({ agent: "Research Agent", status: "running", message: `Searching: "${query}"` });

    try {
      const { results } = await tavilySearch(query, { maxResults: 5 });
      totalSearches++;
      const elapsed = Date.now() - startMs;
      emit({
        agent: "Research Agent",
        status: "complete",
        message: `${results.length} results (${elapsed}ms)`,
        elapsed,
      });

      // Full-content extract for top 2 results
      for (const result of results.slice(0, 2)) {
        emit({ agent: "Research Agent", status: "running", message: `Reading: ${result.url}` });
        try {
          const content = await tavilyExtract(result.url);
          if (content) {
            allResults.push(`SOURCE: ${result.url}\nTITLE: ${result.title}\n${content.slice(0, 2000)}`);
            emit({ agent: "Research Agent", status: "complete", message: "Article extracted" });
          } else {
            allResults.push(`SOURCE: ${result.url}\nTITLE: ${result.title}\n${result.content}`);
          }
        } catch {
          allResults.push(`SOURCE: ${result.url}\nTITLE: ${result.title}\n${result.content}`);
        }
      }

      // Snippet-only for the rest
      for (const result of results.slice(2)) {
        allResults.push(`SOURCE: ${result.url}\nTITLE: ${result.title}\n${result.content}`);
      }
    } catch {
      emit({ agent: "Research Agent", status: "error", message: `Search failed: "${query}" — skipping` });
    }
  }

  emit({ agent: "Research Agent", status: "running", message: `Synthesising ${allResults.length} sources into report...` });

  if (allResults.length === 0) {
    emit({ agent: "Research Agent", status: "error", message: "No search results — writing limited report" });
  }

  const report = await chat([
    {
      role: "system",
      content: `You are a senior market research analyst.

Write a grounded market research report of 700–900 words based ONLY on the sources provided below.

Structure (use these exact headings):
## Executive Summary
## Market Size & Adoption
## Competitive Landscape
## Regulatory Environment
## Target Audience Profile
## Opportunity Analysis
## Sources

STRICT RULES — non-negotiable:
- Every numeric claim (market size, growth rate, percentage, price) MUST be followed by an inline citation: [Source: <url>]
- If no source in the provided data confirms a figure, write "Data unavailable" — do NOT estimate or invent
- Do NOT mix in facts from your training data — only use what is in the provided sources
- If the search results are thin for a section, write a short paragraph saying what data could not be confirmed and why it matters
- Tailor all analysis to the actual product, geography, and sector in the brief`,
    },
    {
      role: "user",
      content: `Brief: ${ctx.briefText}

Client: ${ctx.clientCompany}

--- START OF SEARCH RESULTS ---
${allResults.length > 0 ? allResults.join("\n\n---\n\n") : "No results returned from search."}
--- END OF SEARCH RESULTS ---

Write the market research report now. Use only what is in the sources above.`,
    },
  ], { temperature: 0.2, maxTokens: 2000 });

  const wordCount = report.trim().split(/\s+/).length;
  emit({ agent: "Research Agent", status: "complete", message: `Report complete — ${wordCount} words, ${totalSearches} searches` });

  return report;
}
