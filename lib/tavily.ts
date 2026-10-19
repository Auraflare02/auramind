export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function searchTavily(query: string, maxResults = 4): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 12000);

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      signal: ac.signal,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: maxResults,
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`[tavily] Search failed with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    return (data?.results || []).map((r: any) => ({
      title: String(r.title || ""),
      url: String(r.url || ""),
      content: String(r.content || "").slice(0, 1000),
      score: Number(r.score || 0),
    }));
  } catch (err) {
    console.warn("[tavily] External search error:", (err as Error).message);
    return [];
  }
}
