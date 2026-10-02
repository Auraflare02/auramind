import OpenAI from "openai";
import { NextResponse } from "next/server";
import { makeDemoPlan } from "../../../lib/demo-engine";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    goal_summary: { type: "string" },
    success_definition: { type: "string" },
    weekly_focus: { type: "string" },
    risk_notes: { type: "array", items: { type: "string" } },
    milestones: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          outcome: { type: "string" },
          timing: { type: "string" }
        },
        required: ["title", "outcome", "timing"]
      }
    },
    research: {
      type: "object",
      additionalProperties: false,
      properties: {
        research_summary: { type: "string" },
        requirements: { type: "array", items: { type: "string" } },
        prerequisites: { type: "array", items: { type: "string" } },
        common_bottlenecks: { type: "array", items: { type: "string" } },
        strategy: { type: "array", items: { type: "string" } }
      },
      required: [
        "research_summary",
        "requirements",
        "prerequisites",
        "common_bottlenecks",
        "strategy"
      ]
    },
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
  required: [
    "goal_summary",
    "success_definition",
    "weekly_focus",
    "risk_notes",
    "milestones",
    "research",
    "schedule"
  ]
} as const;

function citationSources(response: any) {
  const sources: { title: string; url: string }[] = [];
  for (const item of response?.output ?? []) {
    for (const content of item?.content ?? []) {
      for (const annotation of content?.annotations ?? []) {
        if (annotation?.type === "url_citation" && annotation?.url) {
          const url = String(annotation.url);
          if (!sources.some((source) => source.url === url)) {
            sources.push({ title: String(annotation.title ?? url), url });
          }
        }
      }
    }
  }
  return sources.slice(0, 12);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = String(body.goal ?? "").trim();
    const deadline = String(body.deadline ?? "").trim();
    const currentLevel = String(body.currentLevel ?? "").trim();
    const targetLevel = String(body.targetLevel ?? "").trim();
    const fixedSchedule = String(body.fixedSchedule ?? "").trim();
    const dailyHours = Number(body.dailyHours ?? 3);
    const timezone = String(body.timezone ?? "Asia/Kolkata");

    if (!goal || !deadline || !currentLevel || !targetLevel) {
      return NextResponse.json(
        { error: "Goal, deadline, current level and target level are required." },
        { status: 400 }
      );
    }

    const aiMode = (process.env.AURAMIND_AI_MODE ?? "demo").toLowerCase();

    if (aiMode !== "api" || !process.env.OPENAI_API_KEY) {
      const demo = makeDemoPlan({
        goal,
        deadline,
        currentLevel,
        targetLevel,
        fixedSchedule,
        dailyHours,
        timezone
      });

      return NextResponse.json({
        ...demo,
        milestones: [
          {
            title: "Foundation",
            outcome: "Identify the exact skills and knowledge needed for the goal.",
            timing: "Days 1–2"
          },
          {
            title: "Execution",
            outcome: "Complete focused practice and produce evidence of progress.",
            timing: "Days 3–5"
          },
          {
            title: "Checkpoint",
            outcome: "Test, review errors and adjust the next week's workload.",
            timing: "Days 6–7"
          }
        ],
        research: {
          research_summary: "Live research is disabled in free Core mode.",
          requirements: ["Use the user's stated goal, deadline, current level and target."],
          prerequisites: ["Collect enough information to define the next concrete task."],
          common_bottlenecks: ["Unclear tasks", "Overloaded schedules", "Inconsistent check-ins"],
          strategy: ["Start small", "Measure actual behavior", "Adapt from repeated evidence"]
        },
        researchSources: [],
        engine: "core"
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const configured = process.env.OPENAI_MODEL ?? "gpt-6-astra";
    const model = configured || "gpt-6-astra";

    const response = await openai.responses.create({
      model,
      reasoning: { effort: "high" },
      tools: [{ type: "web_search" }],
      tool_choice: "required",
      input: [
        {
          role: "system",
          content:
            "You are AuraMind's Goal Intelligence Engine. First research the user's goal using authoritative, current web sources. Then synthesize the research with the user's real schedule and constraints. Do not invent requirements or cite unsupported claims. Identify prerequisites, workload, common bottlenecks, progression, and practical strategy. Build a detailed but realistic 7-day timetable around fixed commitments. Each block must have a concrete action, duration, priority, and reason. Prefer spaced practice, active recall, deliberate practice, recovery, and review when appropriate to the domain. Do not promise success. Return only the requested structured data."
        },
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
          name: "auramind_goal_intelligence",
          strict: true,
          schema
        }
      }
    });

    const parsed = JSON.parse(response.output_text);
    return NextResponse.json({
      ...parsed,
      researchSources: citationSources(response),
      engine: "ai"
    });
  } catch (error: any) {
    console.error("AuraMind goal intelligence error:", error);
    return NextResponse.json(
      {
        error: "AuraMind could not build the researched goal.",
        details: {
          status: Number(error?.status) || 500,
          code: typeof error?.code === "string" ? error.code : undefined,
          message:
            typeof error?.message === "string"
              ? error.message
              : "Unknown OpenAI/API error."
        }
      },
      { status: Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500 }
    );
  }
}
