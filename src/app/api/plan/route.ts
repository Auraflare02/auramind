import OpenAI from "openai";
import { NextResponse } from "next/server";

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
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

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

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL || "gpt-5.6-luna";

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

    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error) {
    console.error("AuraMind plan error:", error);
    return NextResponse.json({ error: "AuraMind could not generate the plan." }, { status: 500 });
  }
}
