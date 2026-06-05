export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  results: TavilyResult[];
  answer?: string;
}

export async function tavilySearch(
  query: string,
  opts: { maxResults?: number; includeAnswer?: boolean } = {}
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set");

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      max_results: opts.maxResults ?? 5,
      include_answer: opts.includeAnswer ?? false,
      search_depth: "advanced",
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.statusText}`);
  }

  return res.json();
}

export async function tavilyExtract(url: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set");

  const res = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey, urls: [url] }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  return data.results?.[0]?.raw_content ?? "";
}
