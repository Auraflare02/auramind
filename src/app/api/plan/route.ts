import OpenAI from "openai";
import { NextResponse } from "next/server";
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
                priority: { type: "string", enum: ["high","medium","low"] },
                reason: { type: "string" }
              },
              required: ["start","end","activity","category","priority","reason"]
            }
          }
        },
        required: ["day","date","blocks"]
      }
    }
  },
  required: ["goal_summary","success_definition","weekly_focus","risk_notes","schedule"]
} as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = String(body.goal ?? "").trim();
    const deadline = String(body.deadline ?? "").trim();
    const currentLevel = String(body.currentLevel ?? "").trim();
    const targetLevel = String(body.targetLevel ?? "").trim();
    const fixedSchedule = String(body.fixedSchedule ?? "").trim();
    const dailyHours = Number(body.dailyHours ?? 2);
    const timezone = String(body.timezone ?? "Asia/Kolkata");

    if (!goal || !deadline || !currentLevel || !targetLevel) {
      return NextResponse.json(
        { error: "Goal, deadline, current level and target level are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        makeDemoPlan({ goal, deadline, currentLevel, targetLevel, fixedSchedule, dailyHours, timezone })
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const configured = process.env.OPENAI_MODEL ?? "";
    const model = configured.startsWith("gpt-6-") ? configured : "gpt-6-luna";

    const system = [
      "You are AuraMind, an AI accountability planning engine.",
      "Create a realistic initial 7-day schedule around fixed commitments.",
      "Treat the user's stated goal, deadline, current level and target level as the core constraints.",
      "Prefer focused blocks of 25 to 60 minutes with sensible breaks.",
      "Do not overload the user or invent commitments.",
      "Do not promise that the user will achieve the goal.",
      "The plan must be practical and easy to track hour by hour.",
      "Return only the requested structured data."
    ].join(" ");

    const response = await openai.responses.create({
      model,
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content: JSON.stringify({
            goal,
            deadline,
            current_level: currentLevel,
            target_level: targetLevel,
            fixed_schedule: fixedSchedule,
            daily_available_hours: dailyHours,
            timezone
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "auramind_plan",
          strict: true,
          schema: planSchema
        }
      }
    });

    return NextResponse.json({ ...JSON.parse(response.output_text), engine: "openai" });
  } catch (error: any) {
    console.error("AuraMind plan error:", error);

    const status = Number(error?.status) || 500;
    const code = typeof error?.code === "string" ? error.code : undefined;
    const type = typeof error?.type === "string" ? error.type : undefined;
    const message =
      typeof error?.message === "string"
        ? error.message
        : "Unknown OpenAI/API error.";

    // A 429 usually means the API has no usable quota/credits or the request hit a rate limit.
    // Keep AuraMind usable in demo mode instead of blocking the product.
    if (status === 429) {
      return NextResponse.json({
        ...makeDemoPlan({
          goal,
          deadline,
          currentLevel,
          targetLevel,
          fixedSchedule,
          dailyHours,
          timezone
        }),
        engine: "demo"
      });
    }

    return NextResponse.json(
      {
        error: "AuraMind could not generate the plan.",
        details: { status, code, type, message }
      },
      { status: status >= 400 && status < 600 ? status : 500 }
    );
  }
}
