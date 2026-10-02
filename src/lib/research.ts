type SearchResult = {
  title?: string;
  url?: string;
  content?: string;
};

export type ResearchResult = {
  query: string;
  results: SearchResult[];
};

function clean(text: unknown, max = 3500) {
  return String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function researchGoal(goal: string, currentLevel: string, targetLevel: string) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return {
      available: false,
      searches: [] as ResearchResult[],
      note: "No web-search provider is configured. Add TAVILY_API_KEY to enable live goal research."
    };
  }

  const queries = [
    `${goal} requirements prerequisites best practices`,
    `${goal} realistic study plan workload common mistakes`,
    `${goal} ${currentLevel} ${targetLevel} strategy`
  ];

  const searches: ResearchResult[] = [];

  for (const query of queries) {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: false
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Research provider returned ${response.status}`);
    }

    const data = await response.json();
    searches.push({
      query,
      results: Array.isArray(data?.results)
        ? data.results.map((item: SearchResult) => ({
            title: clean(item.title, 180),
            url: clean(item.url, 500),
            content: clean(item.content)
          }))
        : []
    });
  }

  return {
    available: true,
    searches,
    note: "Live research was retrieved from the configured web-search provider."
  };
}
