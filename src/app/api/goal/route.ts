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
  let goal = "";
  let deadline = "";
  let currentLevel = "";
  let targetLevel = "";
  let fixedSchedule = "";
  let dailyHours = 3;
  let timezone = "Asia/Kolkata";
  let preferredFocusTime = "";
  let knownDistractions = "";
  let pastAttempts = "";
  let constraints = "";

  try {
    const body = await request.json();
    goal = String(body.goal ?? "").trim();
    deadline = String(body.deadline ?? "").trim();
    currentLevel = String(body.currentLevel ?? "").trim();
    targetLevel = String(body.targetLevel ?? "").trim();
    fixedSchedule = String(body.fixedSchedule ?? "").trim();
    dailyHours = Number(body.dailyHours ?? 3);
    timezone = String(body.timezone ?? "Asia/Kolkata");
    preferredFocusTime = String(body.preferredFocusTime ?? "").trim();
    knownDistractions = String(body.knownDistractions ?? "").trim();
    pastAttempts = String(body.pastAttempts ?? "").trim();
    constraints = String(body.constraints ?? "").trim();

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
        goalContext: {
          goal,
          deadline,
          currentLevel,
          targetLevel,
          fixedSchedule,
          dailyHours,
          timezone,
          preferredFocusTime,
          knownDistractions,
          pastAttempts,
          constraints
        },
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

    let research;
    try {
      research = await researchGoal(goal, currentLevel, targetLevel);
    } catch (researchError) {
      console.error("AuraMind research error:", researchError);
      research = {
        available: false,
        searches: [],
        note: "Live web research was temporarily unavailable; Gemini will continue using its own reasoning."
      };
    }

    const prompt = `
You are AuraMind's senior goal architect. You are not a generic chatbot.

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

PREFERRED FOCUS TIME
${preferredFocusTime || "Not specified; infer conservatively."}

KNOWN DISTRACTIONS
${knownDistractions || "Not specified."}

WHAT HAS BEEN TRIED BEFORE
${pastAttempts || "Not specified."}

SPECIAL CONSTRAINTS
${constraints || "None specified."}

TIMEZONE
${timezone}

RESEARCH DATA
${researchText(research)}

Build a detailed, realistic 7-day operating plan.

RESEARCH RULES
- Use the supplied research data as evidence when it exists.
- Prefer authoritative/first-party sources when the retrieved research contains them.
- Never invent factual claims. When research is unavailable, clearly base planning on the user's supplied information and general reasoning.
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
- Every focus block must state a concrete deliverable or measurable action.
- Avoid repeated generic tasks such as "study", "practice", or "work"; specify what to study/do and what evidence of completion to produce.
- Sequence the week intelligently: diagnose → learn/fix prerequisites → deliberate practice → application → review/error repair → checkpoint.
- Allocate harder work to plausible high-energy windows and lighter work after demanding commitments.
- Leave realistic buffers for meals, travel, transitions, and recovery.
- Include recovery/breaks where needed.
- Do not promise the user will achieve the goal.
- Do not shame missed work; it becomes data for the accountability engine.

Return only JSON matching the schema.
`;

    const response = await gemini.models.generateContent({
      model: ["gemini-3.8-flash", "gemini-3.7-flash"].includes(getGeminiModel())
        ? getGeminiModel()
        : "gemini-3.8-flash",
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
      goalContext: {
        goal,
        deadline,
        currentLevel,
        targetLevel,
        fixedSchedule,
        dailyHours,
        timezone,
        preferredFocusTime,
        knownDistractions,
        pastAttempts,
        constraints
      },
      researchSources: sourceLinks(research),
      engine: "gemini"
    });
  } catch (error: any) {
    console.error("AuraMind goal intelligence error:", error);

    if (goal && deadline && currentLevel && targetLevel) {
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
        goalContext: {
          goal,
          deadline,
          currentLevel,
          targetLevel,
          fixedSchedule,
          dailyHours,
          timezone,
          preferredFocusTime,
          knownDistractions,
          pastAttempts,
          constraints
        },
        engine: "core",
        research: {
          research_summary: "AI research was temporarily unavailable. AuraMind Core generated a usable plan from your real constraints.",
          requirements: [],
          prerequisites: [],
          common_bottlenecks: [],
          strategy: []
        },
        researchSources: []
      });
    }

    return NextResponse.json({ error: "AuraMind could not build the goal." }, { status: 500 });
  }
}
