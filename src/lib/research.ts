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

  async function runSearch(query: string): Promise<ResearchResult> {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: false
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(7000)
    });

    if (!response.ok) {
      throw new Error(`Research provider returned ${response.status}`);
    }

    const data = await response.json();
    return {
      query,
      results: Array.isArray(data?.results)
        ? data.results.map((item: SearchResult) => ({
            title: clean(item.title, 180),
            url: clean(item.url, 500),
            content: clean(item.content)
          }))
        : []
    };
  }

  const settled = await Promise.allSettled(queries.map(runSearch));
  const searches = settled
    .filter((result): result is PromiseFulfilledResult<ResearchResult> => result.status === "fulfilled")
    .map((result) => result.value);

  return {
    available: searches.length > 0,
    searches,
    note:
      searches.length === queries.length
        ? "Live research was retrieved from the configured web-search provider."
        : searches.length
          ? "Live research was partially retrieved; unavailable searches were skipped."
          : "Live research was unavailable; AuraMind will continue with Gemini/Core reasoning."
  };
}


export type QuestionResearchResult = {
  available: boolean;
  searches: ResearchResult[];
  note: string;
};

export async function researchQuestion(question: string): Promise<QuestionResearchResult> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return {
      available: false,
      searches: [],
      note: "No live web-search provider is configured."
    };
  }

  const queries = [
    question,
    question + " official source"
  ];

  const settled = await Promise.allSettled(
    queries.map(async (query) => {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: key,
          query,
          search_depth: "basic",
          max_results: 5,
          include_answer: false
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000)
      });

      if (!response.ok) throw new Error(`Research provider returned ${response.status}`);

      const data = await response.json();
      return {
        query,
        results: Array.isArray(data?.results)
          ? data.results.map((item: SearchResult) => ({
              title: clean(item.title, 180),
              url: clean(item.url, 500),
              content: clean(item.content)
            }))
          : []
      } satisfies ResearchResult;
    })
  );

  const searches = settled
    .filter((item): item is PromiseFulfilledResult<ResearchResult> => item.status === "fulfilled")
    .map((item) => item.value);

  return {
    available: searches.length > 0,
    searches,
    note: searches.length
      ? "Live web research was retrieved for this question."
      : "Live web research was unavailable."
  };
}
