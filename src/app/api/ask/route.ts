import { NextResponse } from "next/server";
import { generateGeminiJson, getGeminiClient } from "../../../lib/ai";
import { getServerDb } from "../../../lib/server-db";
import { getKnowledgeForGoal } from "../../../lib/knowledge";
import { cleanString } from "../../../lib/validation";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: ["explain", "plan", "reschedule", "analyze", "motivation", "general", "needs_research"]
    },
    answer: { type: "string" },
    actions: { type: "array", items: { type: "string" } },
    caveat: { type: "string" },
    confidence: { type: "string", enum: ["grounded", "reasoned", "needs_research"] }
  },
  required: ["intent", "answer", "actions", "caveat", "confidence"]
} as const;

function clip(value: unknown, max: number) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? {});
  return text.slice(0, max);
}

function needsFreshResearch(question: string) {
  return /\b(latest|current|today|tomorrow|2026|2027|price|pricing|deadline|rule|rules|policy|law|regulation|syllabus|admission|eligibility|requirement)\b/i.test(question);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = cleanString(body?.question, 2000);

  if (!question) return NextResponse.json({ error: "Question is required." }, { status: 400 });

  const db = getServerDb();
  const token = request.headers.get("x-session-token")?.trim() || "";

  let plan = body?.plan ?? null;
  let logs = Array.isArray(body?.logs) ? body.logs.slice(-168) : [];
  let reports = Array.isArray(body?.reports) ? body.reports.slice(-20) : [];
  let history: Array<{ role: "user" | "assistant"; content: string }> = [];
  let runId = "";

  if (token && db) {
    const { data: run } = await db
      .from("auramind_goal_runs")
      .select("id,plan")
      .eq("access_token", token)
      .maybeSingle();

    if (run) {
      runId = run.id;
      plan = run.plan;

      const [{ data: storedLogs }, { data: storedReports }, { data: storedMessages }] = await Promise.all([
        db.from("auramind_run_logs").select("*").eq("run_id", run.id).order("logged_for", { ascending: false }).limit(168),
        db.from("auramind_run_reports").select("report_type,report_key,payload").eq("run_id", run.id).order("created_at", { ascending: false }).limit(20),
        db.from("auramind_messages").select("role,content").eq("run_id", run.id).order("created_at", { ascending: true }).limit(12)
      ]);

      logs = storedLogs ?? [];
      reports = storedReports ?? [];
      history = (storedMessages ?? []).map((item) => ({
        role: item.role === "user" ? "user" : "assistant",
        content: String(item.content)
      }));
    }
  }

  const goal = cleanString(plan?.goalContext?.goal ?? plan?.goal_summary, 2000);
  const knowledge = await getKnowledgeForGoal(goal || question, 8);

  if (!getGeminiClient()) {
    return NextResponse.json({
      intent: needsFreshResearch(question) ? "needs_research" : "general",
      answer: "Gemini is not configured, so AuraMind Core cannot give a full AI answer yet.",
      actions: ["Configure GEMINI_API_KEY and retry this question."],
      caveat: "No Gemini response was generated.",
      confidence: "needs_research",
      engine: "core"
    });
  }

  const systemInstruction = [
    "You are AuraMind, a precise goal-execution assistant.",
    "Answer the actual user question. Do not force unrelated questions into a schedule.",
    "Use the active goal, plan, behavior logs, reports, conversation history and knowledge base when relevant.",
    "For explanations, teach clearly with simple examples.",
    "For planning, give concrete and realistic actions.",
    "For rescheduling, protect sleep, meals, fixed commitments and recovery.",
    "For behavior analysis, only call something a pattern when the data supports repetition.",
    "Treat missed work as information, not a character flaw.",
    "Never invent facts, prices, rules, sources, credentials, dates or guarantees.",
    "When the question asks for a fresh fact that is not in supplied context, classify confidence as needs_research.",
    "Return only valid JSON matching the schema."
  ].join("\n");

  const contents = [
    "SERVER DATE: " + new Date().toISOString(),
    "USER QUESTION:\n" + question,
    "ACTIVE GOAL:\n" + clip(plan?.goalContext ?? { goal: plan?.goal_summary }, 10000),
    "CURRENT PLAN:\n" + clip(plan, 26000),
    "RECENT BEHAVIOR:\n" + clip(logs, 26000),
    "RECENT REPORTS:\n" + clip(reports, 14000),
    "KNOWLEDGE:\n" + clip(knowledge, 14000),
    "RECENT CONVERSATION:\n" + clip(history, 9000)
  ].join("\n\n");

  try {
    const result = await generateGeminiJson<{
      intent: string;
      answer: string;
      actions: string[];
      caveat: string;
      confidence: string;
    }>({
      contents,
      responseSchema: schema,
      thinkingLevel: needsFreshResearch(question) ? "high" : "medium",
      systemInstruction
    });

    const responseData = {
      intent: result.intent,
      answer: cleanString(result.answer, 5000),
      actions: Array.isArray(result.actions)
        ? result.actions.map((item) => cleanString(item, 600)).filter(Boolean).slice(0, 8)
        : [],
      caveat: cleanString(result.caveat, 1200),
      confidence: result.confidence,
      engine: "gemini"
    };

    if (runId && db) {
      try {
        await db.from("auramind_messages").insert([
          { run_id: runId, role: "user", content: question },
          { run_id: runId, role: "assistant", content: responseData.answer }
        ]);
      } catch (error) {
        console.error("AuraMind assistant memory write error:", error);
      }
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("AuraMind assistant error:", error);
    return NextResponse.json({
      intent: "general",
      answer: "AuraMind could not generate a reliable AI answer right now. Your saved goal data is unchanged.",
      actions: ["Retry after the AI service recovers."],
      caveat: "The answer was not generated because Gemini failed.",
      confidence: "needs_research",
      engine: "core",
      degraded: true
    });
  }
}
