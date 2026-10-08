import { getServerDb } from "./server-db";

export async function getKnowledgeForGoal(goal: string, limit = 8) {
  const db = getServerDb();
  if (!db) return [];

  try {
    const { data } = await db
      .from("auramind_knowledge")
      .select("slug,title,domain,content,source_url,priority")
      .eq("active", true)
      .order("priority", { ascending: false })
      .limit(limit);

    return data ?? [];
  } catch (error) {
    console.error("AuraMind knowledge lookup error:", error);
    return [];
  }
}
