import { NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "../../../../lib/gemini";
import { makeDemoDailyReport } from "../../../../lib/demo-engine";

const schema = {
  type: "object",
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
  let logs: any[] = [];
  let date = "";
  let plan: any = null;

  try {
    const body = await request.json();
    logs = Array.isArray(body?.logs) ? body.logs : [];
    date = String(body?.date ?? "").trim();
    plan = body?.plan ?? null;

    if (!date) {
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    }

    const calculated = calculate(logs);
    const gemini = getGeminiClient();

    if (!gemini) {
      return NextResponse.json(makeDemoDailyReport(date, logs));
    }

    const response = await gemini.models.generateContent({
      model: getGeminiModel(),
      contents: [
        "You are AuraMind's daily behavioral coach.",
        "Analyze the supplied plan and self-reported hourly logs.",
        "Distinguish task difficulty, misunderstanding, fatigue, interruption, boredom, digital distraction, and planning mismatch.",
        "Do not shame the user. A missed task is data, not proof of laziness.",
        "Only call something a pattern when the supplied data supports it.",
        "Give one concrete change for tomorrow.",
        JSON.stringify({ date, plan, logs, calculated })
      ].join("\n\n"),
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) throw new Error("Gemini returned an empty daily report.");
    return NextResponse.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("AuraMind daily report error:", error);
    return NextResponse.json(
      {
        error: "AuraMind could not analyse this day.",
        details: {
          status: Number(error?.status) || 500,
          message:
            typeof error?.message === "string"
              ? error.message
              : "Unknown Gemini error."
        }
      },
      { status: 500 }
    );
  }
}
