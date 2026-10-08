import { NextResponse } from "next/server";
import { generateGeminiJson, getGeminiClient } from "../../../../lib/ai";
import { makeDemoWeeklyReport } from "../../../../lib/demo-engine";

const schema = {
  type: "object",
  properties: {
    weekStart: { type: "string" },
    weekEnd: { type: "string" },
    completionPercent: { type: "number" },
    focusedMinutes: { type: "integer" },
    distractionMinutes: { type: "integer" },
    bestPeriod: { type: "string" },
    worstPeriod: { type: "string" },
    topDistractions: { type: "array", items: { type: "string" } },
    recurringReasons: { type: "array", items: { type: "string" } },
    patterns: { type: "array", items: { type: "string" } },
    recommendations: { type: "array", items: { type: "string" } },
    aiSummary: { type: "string" }
  },
  required: [
    "weekStart",
    "weekEnd",
    "completionPercent",
    "focusedMinutes",
    "distractionMinutes",
    "bestPeriod",
    "worstPeriod",
    "topDistractions",
    "recurringReasons",
    "patterns",
    "recommendations",
    "aiSummary"
  ]
} as const;

function dateOnly(value: Date) {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function parseDate(value: string) {
  return new Date(value + "T00:00:00+05:30");
}

function calculate(logs: any[]) {
  const plannedMinutes = logs.reduce(
    (sum, log) =>
      sum +
      (log?.plannedActivity &&
      !/break|free time|unplanned/i.test(String(log.plannedActivity))
        ? 60
        : 0),
    0
  );
  const focusedMinutes = logs.reduce(
    (sum, log) => sum + Math.max(0, Number(log?.focusedMinutes ?? 0)),
    0
  );
  const distractionMinutes = logs.reduce(
    (sum, log) => sum + Math.max(0, Number(log?.distractionMinutes ?? 0)),
    0
  );
  const completionPercent = plannedMinutes
    ? Math.min(100, Math.round((focusedMinutes / plannedMinutes) * 1000) / 10)
    : 0;

  return { plannedMinutes, focusedMinutes, distractionMinutes, completionPercent };
}

export async function POST(request: Request) {
  let anchorDate = "";
  let allLogs: any[] = [];

  try {
    const body = await request.json();
    anchorDate = String(body?.anchorDate ?? "").trim();
    allLogs = Array.isArray(body?.logs) ? body.logs : [];

    if (!anchorDate) {
      return NextResponse.json({ error: "Anchor date is required." }, { status: 400 });
    }

    const end = parseDate(anchorDate);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 6);

    const weekStart = dateOnly(start);
    const weekEnd = dateOnly(end);
    const weekLogs = allLogs.filter(
      (log) =>
        typeof log?.date === "string" &&
        log.date >= weekStart &&
        log.date <= weekEnd
    );
    const calculated = calculate(weekLogs);
    const gemini = getGeminiClient();

    if (!gemini) {
      return NextResponse.json(makeDemoWeeklyReport(anchorDate, allLogs));
    }

    const result = await generateGeminiJson<Record<string, any>>({
      contents: [
        "Analyze seven days of self-reported hourly data.",
        "A pattern requires repetition across multiple days or entries.",
        "Distinguish workload, task difficulty, misunderstanding, fatigue, interruptions, boredom, digital distraction and schedule mismatch.",
        "Identify useful time windows and concrete next-week changes.",
        "Do not shame the user or equate missed work with laziness.",
        JSON.stringify({ weekStart, weekEnd, logs: weekLogs, calculated })
      ].join("\n\n"),
      responseSchema: schema,
      thinkingLevel: "medium",
      systemInstruction: "You are AuraMind's weekly behavioral intelligence coach. Be evidence-based and conservative about patterns."
    });

    return NextResponse.json({
      ...result,
      weekStart,
      weekEnd,
      focusedMinutes: calculated.focusedMinutes,
      distractionMinutes: calculated.distractionMinutes
    });
  } catch (error: any) {
    console.error("AuraMind weekly report AI error; using Core fallback:", error);
    return NextResponse.json({
      ...makeDemoWeeklyReport(anchorDate, allLogs),
      engine: "core",
      degraded: true
    });
  }
}
