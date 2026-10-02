import { NextResponse } from "next/server";
import { getGeminiClient, getGeminiModel } from "../../../lib/gemini";
import { researchGoal } from "../../../lib/research";
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

function sourceLinks(research: Awaited<ReturnType<typeof researchGoal>>) {
  const sources: { title: string; url: string }[] = [];
  for (const search of research.searches) {
    for (const result of search.results) {
      if (!result.url) continue;
      if (!sources.some((source) => source.url === result.url)) {
        sources.push({
          title: result.title || result.url,
          url: result.url
        });
      }
    }
  }
  return sources.slice(0, 15);
}

function researchText(research: Awaited<ReturnType<typeof researchGoal>>) {
  if (!research.available) return "No live web research was available.";
  return research.searches
    .map(
      (search) =>
        "SEARCH: " +
        search.query +
        "\n" +
        search.results
          .map(
            (result) =>
              "- " +
              (result.title || "Untitled") +
              " | " +
              (result.url || "") +
              "\n  " +
              (result.content || "")
          )
          .join("\n")
    )
    .join("\n\n");
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

    const gemini = getGeminiClient();
    if (!gemini) {
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
        engine: "core",
        research: {
          research_summary: "Add GEMINI_API_KEY for AI reasoning and TAVILY_API_KEY for live web research.",
          requirements: [],
          prerequisites: [],
          common_bottlenecks: [],
          strategy: []
        },
        researchSources: []
      });
    }

    const research = await researchGoal(goal, currentLevel, targetLevel);
    const prompt = `
You are AuraMind, a serious goal-accountability system, not a generic chatbot.

USER GOAL
${goal}

DEADLINE
${deadline}

CURRENT LEVEL
${currentLevel}

TARGET
${targetLevel}

FIXED COMMITMENTS
${fixedSchedule || "None supplied"}

AVAILABLE FOCUS TIME PER DAY
${dailyHours} hours

TIMEZONE
${timezone}

RESEARCH DATA
${researchText(research)}

Build a detailed, realistic 7-day operating plan.

RESEARCH RULES
- Use the supplied research data as evidence.
- Prefer authoritative/first-party sources when available.
- Never invent a requirement when the research does not support it.
- Explain important decisions briefly.
- Distinguish evidence from planning judgement.

PLANNING RULES
- Respect fixed commitments and sleep.
- Do not fill every available minute.
- Use specific tasks, not labels like "study" or "work".
- Vary task type across the week: foundation, deliberate practice, review, error repair, application, checkpoint as appropriate to the goal.
- Break large work into trackable sessions.
- Adapt difficulty to the stated current level.
- Make each block actionable enough that the user knows exactly what to do.
- Include recovery/breaks where needed.
- Do not promise the user will achieve the goal.
- Do not shame missed work; it becomes data for the accountability engine.

Return only JSON matching the schema.
`;

    const response = await gemini.models.generateContent({
      model: getGeminiModel(),
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsed = JSON.parse(response.text);
    return NextResponse.json({
      ...parsed,
      researchSources: sourceLinks(research),
      engine: "gemini"
    });
  } catch (error: any) {
    console.error("AuraMind goal intelligence error:", error);
    return NextResponse.json(
      {
        error: "AuraMind could not build the researched goal.",
        details: {
          status: Number(error?.status) || 500,
          message:
            typeof error?.message === "string"
              ? error.message
              : "Unknown Gemini/research error."
        }
      },
      { status: Number(error?.status) >= 400 && Number(error?.status) < 600 ? Number(error.status) : 500 }
    );
  }
}
