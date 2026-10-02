import OpenAI from "openai";
import { NextResponse } from "next/server";
import { makeDemoDailyReport } from "../../../../lib/demo-engine";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    date: { type: "string" },
    completionPercent: { type: "number" },
    plannedMinutes: { type: "integer" },
    focusedMinutes: { type: "integer" },
    distractionMinutes: { type: "integer" },
    strongestPeriod: { type: "string" },
    weakestPeriod: { type: "string" },
    keyProblem: { type: "string" },
    solution: { type: "string" },
    aiSummary: { type: "string" }
  },
  required: [
    "date",
    "completionPercent",
    "plannedMinutes",
    "focusedMinutes",
    "distractionMinutes",
    "strongestPeriod",
    "weakestPeriod",
    "keyProblem",
    "solution",
    "aiSummary"
  ]
} as const;

export async function POST(request: Request) {
  let logs: any[] = [];
  let date = "";
  let plan: any = null;

  try {
    const body = await request.json();
    logs = Array.isArray(body.logs) ? body.logs : [];
    plan = body.plan ?? null;
    date = String(body.date ?? "");

    if (!date) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }

    const plannedMinutes = logs.reduce(
      (sum: number, log: { plannedActivity?: string }) =>
        sum + (log.plannedActivity && !/break|free time|unplanned/i.test(log.plannedActivity) ? 60 : 0),
      0
    );
    const focusedMinutes = logs.reduce(
      (sum: number, log: { focusedMinutes?: number }) => sum + Number(log.focusedMinutes ?? 0),
      0
    );
    const distractionMinutes = logs.reduce(
      (sum: number, log: { distractionMinutes?: number }) => sum + Number(log.distractionMinutes ?? 0),
      0
    );
    const completionPercent = plannedMinutes
      ? Math.min(100, Math.round((focusedMinutes / plannedMinutes) * 1000) / 10)
      : 0;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(makeDemoDailyReport(date, logs));
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
            "You are AuraMind's daily accountability analyst. Analyse self-reported hourly logs. Do not shame the user. Do not call a single missed task laziness. Distinguish difficulty, fatigue, interruptions, poor planning, boredom and digital distraction. Identify the strongest and weakest time periods only from supplied data. Give one concrete solution that can be applied tomorrow. Return only structured data."
        },
        {
          role: "user",
          content: JSON.stringify({
            date,
            plan,
            logs,
            calculated: { plannedMinutes, focusedMinutes, distractionMinutes, completionPercent }
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "auramind_daily_report",
          strict: true,
          schema
        }
      }
    });

    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error: any) {
    console.error("AuraMind daily report error:", error);

    if (Number(error?.status) === 429) {
      return NextResponse.json(makeDemoDailyReport(date, logs));
    }

    return NextResponse.json(
      {
        error: "AuraMind could not analyse this day.",
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
