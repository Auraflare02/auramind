import { NextResponse } from "next/server";
import { generateGeminiJson, getGeminiClient } from "../../../lib/ai";
import { validateSchedule, cleanString, clampNumber, isIsoDate } from "../../../lib/validation";
import { makeDemoPlan } from "../../../lib/demo-engine";

const planSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    goal_summary: { type: "string" },
    success_definition: { type: "string" },
    weekly_focus: { type: "string" },
    risk_notes: { type: "array", items: { type: "string" } },
    schedule: {
      type: "array",
      minItems: 30,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          day: { type: "string" },
          date: { type: "string" },
          blocks: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                start: { type: "string" },
                end: { type: "string" },
                activity: { type: "string" },
                category: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                reason: { type: "string" }
              },
              required: ["start", "end", "activity", "category", "priority", "reason"]
            }
          }
        },
        required: ["day", "date", "blocks"]
      }
    }
  },
  required: ["goal_summary", "success_definition", "weekly_focus", "risk_notes", "schedule"]
} as const;

function demo(input: {
  goal: string;
  deadline: string;
  currentLevel: string;
  targetLevel: string;
  fixedSchedule: string;
  dailyHours: number;
  timezone: string;
}, reason?: string) {
  return NextResponse.json({
    ...makeDemoPlan(input),
    engine: "demo-fallback",
    ...(reason ? { fallbackReason: reason } : {})
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const goal = String(body?.goal ?? "").trim();
  const deadline = String(body?.deadline ?? "").trim();
  const currentLevel = String(body?.currentLevel ?? "").trim();
  const targetLevel = String(body?.targetLevel ?? "").trim();
  const fixedSchedule = String(body?.fixedSchedule ?? "").trim();
  const dailyHours = Number(body?.dailyHours ?? 3);
  const timezone = String(body?.timezone ?? "Asia/Kolkata").trim() || "Asia/Kolkata";

  if (!goal || !deadline || !currentLevel || !targetLevel || !isIsoDate(deadline)) {
    return NextResponse.json(
      { error: "Goal, deadline, current level and target level are required." },
      { status: 400 }
    );
  }

  const input = {
    goal,
    deadline,
    currentLevel,
    targetLevel,
    fixedSchedule,
    dailyHours: Number.isFinite(dailyHours) ? Math.max(1, Math.min(12, dailyHours)) : 3,
    timezone
  };

  const aiMode = (process.env.AURAMIND_AI_MODE ?? (gemini ? "api" : "demo")).toLowerCase();
  const gemini = getGeminiClient();

  // Keep AuraMind usable without paid API access.
  if (aiMode !== "api" || !gemini) {
    return demo(input);
  }

  const prompt = [
    "You are AuraMind, an AI accountability planning engine.",
    "Create a realistic personalized 30-day timetable around the user's actual constraints.",
    "Treat goal, deadline, current level, target level, fixed commitments, daily available hours and timezone as hard constraints.",
    "Use concrete, measurable tasks and keep focus blocks realistic.",
    "Include sensible breaks and avoid overloading the user.",
    "Progress through appropriate phases such as foundation, deliberate practice, application, error repair, checkpoints and consolidation.",
    "Do not invent commitments, credentials, evidence or guarantees of success.",
    "Return exactly 30 schedule days in the requested JSON structure."
  ].join(" ");

  try {
    const parsed = await generateGeminiJson<Record<string, unknown>>({
      contents: prompt + "\n\nUSER INPUT:\n" + JSON.stringify(input),
      responseSchema: planSchema,
      thinkingLevel: "high",
      systemInstruction: "You are AuraMind's strict planning engine. Return only the requested JSON, obey every hard constraint, and never promise success."
    });

    if (!validateSchedule(parsed.schedule, 30)) {
      return demo(input, "Gemini returned an invalid 30-day timetable.");
    }

    return NextResponse.json({ ...parsed, engine: "gemini" });
  } catch (error: any) {
    console.error("AuraMind plan generation error:", error);
    return demo(
      input,
      typeof error?.message === "string" ? error.message : "AI generation failed."
    );
  }
}
