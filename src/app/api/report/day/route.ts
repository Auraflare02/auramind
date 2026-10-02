import { NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "../../../../lib/gemini";
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

    const aiMode = (process.env.AURAMIND_AI_MODE ?? "demo").toLowerCase();

    if (aiMode !== "api" || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(makeDemoDailyReport(date, logs));
    }

    const configured = process.env.OPENAI_MODEL ?? "";
    const model = configured.startsWith("gpt-6-") ? configured : "gpt-6-astra";
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await gemini.models.generateContent({
      model: getGeminiModel(),
      contents: [
        `You are AuraMind's daily behavioral coach. Analyze the user's self-reported hourly logs against the planned schedule. Be specific and practical. Never shame the user. Never label one missed task as laziness. Identify likely blocker types such as task difficulty, fatigue, interruption, poor planning, boredom, or digital distraction. Only claim patterns supported by the supplied data. Give one concrete change for the next day.`,
        JSON.stringify({
          date,
          plan,
          logs,
          calculated: { plannedMinutes, focusedMinutes, distractionMinutes, completionPercent }
        })
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
      { status: Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500 }
    );
  }
}
