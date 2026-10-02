import OpenAI from "openai";
import { NextResponse } from "next/server";
import { makeDemoWeeklyReport } from "../../../../lib/demo-engine";

const schema = {
  type: "object",
  additionalProperties: false,
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

function parseDate(value: string) {
  return new Date(value + "T00:00:00+05:30");
}

function dateOnly(value: Date) {
  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, "0");
  const d = String(value.getUTCDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const anchorDate = String(body.anchorDate ?? "");
    const logs = Array.isArray(body.logs) ? body.logs : [];

    if (!anchorDate) {
      return NextResponse.json({ error: "Anchor date is required." }, { status: 400 });
    }

    const end = parseDate(anchorDate);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 6);

    const weekStart = dateOnly(start);
    const weekEnd = dateOnly(end);
    const weekLogs = logs.filter(
      (log: { date?: string }) =>
        typeof log.date === "string" && log.date >= weekStart && log.date <= weekEnd
    );

    const plannedMinutes = weekLogs.reduce(
      (sum: number, log: { plannedActivity?: string }) =>
        sum + (log.plannedActivity && !/break|free time|unplanned/i.test(log.plannedActivity) ? 60 : 0),
      0
    );
    const focusedMinutes = weekLogs.reduce(
      (sum: number, log: { focusedMinutes?: number }) => sum + Number(log.focusedMinutes ?? 0),
      0
    );
    const distractionMinutes = weekLogs.reduce(
      (sum: number, log: { distractionMinutes?: number }) => sum + Number(log.distractionMinutes ?? 0),
      0
    );
    const completionPercent = plannedMinutes
      ? Math.min(100, Math.round((focusedMinutes / plannedMinutes) * 1000) / 10)
      : 0;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(makeDemoWeeklyReport(anchorDate, logs));
    }

    const configured = process.env.OPENAI_MODEL ?? "";
    const model = configured.startsWith("gpt-6-") ? configured : "gpt-6-luna";
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model,
      input: [
        {
          role: "system",
          content:
            "You are AuraMind's weekly behavioral analyst. Analyse seven days of self-reported hourly logs. Only call something a pattern when the data supports repetition across multiple entries or days. Do not equate every failure with laziness. Separate digital distraction, difficulty, fatigue, interruption and unrealistic planning. Identify the most productive and least productive time windows using the supplied logs. Give practical schedule changes for next week. Return only structured data."
        },
        {
          role: "user",
          content: JSON.stringify({
            weekStart,
            weekEnd,
            logs: weekLogs,
            calculated: { plannedMinutes, focusedMinutes, distractionMinutes, completionPercent }
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "auramind_weekly_report",
          strict: true,
          schema
        }
      }
    });

    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error: any) {
    console.error("AuraMind weekly report error:", error);

    if (Number(error?.status) === 429) {
      return NextResponse.json(makeDemoWeeklyReport(anchorDate, logs));
    }

    return NextResponse.json(
      {
        error: "AuraMind could not generate the weekly report.",
        details: {
          status: Number(error?.status) || 500,
          code: typeof error?.code === "string" ? error.code : undefined,
          type: typeof error?.type === "string" ? error.type : undefined,
          message: typeof error?.message === "string" ? error.message : "Unknown OpenAI/API error."
        }
      },
      { status: Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500 }
    );
  }
}
