import { NextResponse } from "next/server";
import { generateGeminiJson, getGeminiClient } from "../../../../lib/ai";
import { validateSchedule } from "../../../../lib/validation";
import { makeDemoPlan } from "../../../../lib/demo-engine";
import { requireAdminKey, getServerDb, dbUnavailableMessage } from "../../../../lib/server-db";

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
      required: ["research_summary","requirements","prerequisites","common_bottlenecks","strategy"]
    },
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
  required: ["goal_summary","success_definition","weekly_focus","risk_notes","milestones","research","schedule"]
} as const;

function list(value: unknown) {
  return String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function safeDate(value: string, fallbackDays = 30) {
  const parsed = new Date(value + "T00:00:00+05:30");
  if (!Number.isFinite(parsed.getTime())) {
    const d = new Date();
    d.setDate(d.getDate() + fallbackDays);
    return d.toISOString().slice(0, 10);
  }
  return value;
}

async function loadRequest(db: NonNullable<ReturnType<typeof getServerDb>>, code: string) {
  return db.from("goal_requests").select("*").eq("request_code", code).maybeSingle();
}

export async function GET(request: Request) {
  if (!requireAdminKey(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = getServerDb();
  if (!db) return NextResponse.json({ error: dbUnavailableMessage() }, { status: 503 });

  const { data, error } = await db
    .from("goal_requests")
    .select("request_code,goal,deadline,current_level,target_level,fixed_schedule,daily_hours,timezone,preferred_focus_time,known_distractions,past_attempts,constraints,status,eta_at,research,plan,created_at,ready_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("AuraMind admin list error:", error);
    return NextResponse.json({ error: "Could not load requests." }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}

export async function PATCH(request: Request) {
  if (!requireAdminKey(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const db = getServerDb();
  if (!db) return NextResponse.json({ error: dbUnavailableMessage() }, { status: 503 });

  try {
    const body = await request.json();
    const requestId = String(body?.requestId ?? "").trim().toUpperCase();
    const action = String(body?.action ?? "").trim();

    if (!requestId) return NextResponse.json({ error: "Request ID is required." }, { status: 400 });

    const existing = await loadRequest(db, requestId);
    if (existing.error) return NextResponse.json({ error: "Could not load request." }, { status: 500 });
    if (!existing.data) return NextResponse.json({ error: "Request not found." }, { status: 404 });

    if (action === "start") {
      const { error } = await db.from("goal_requests").update({ status: "researching" }).eq("request_code", requestId);
      if (error) return NextResponse.json({ error: "Could not update request." }, { status: 500 });
      return NextResponse.json({ ok: true, status: "researching" });
    }

    if (action === "save-research") {
      const research = {
        research_summary: String(body?.research_summary ?? "").trim(),
        requirements: list(body?.requirements),
        prerequisites: list(body?.prerequisites),
        common_bottlenecks: list(body?.common_bottlenecks),
        strategy: list(body?.strategy)
      };
      const { error } = await db.from("goal_requests").update({
        research,
        status: "researching"
      }).eq("request_code", requestId);

      if (error) return NextResponse.json({ error: "Could not save research." }, { status: 500 });
      return NextResponse.json({ ok: true, research });
    }

    if (action === "release") {
      if (!existing.data.plan) return NextResponse.json({ error: "Generate and review the plan before releasing it." }, { status: 400 });
      const { data: released, error } = await db
        .from("goal_requests")
        .update({
          status: "ready",
          ready_at: new Date().toISOString()
        })
        .eq("request_code", requestId)
        .select("request_code,status,ready_at")
        .maybeSingle();

      if (error) {
        console.error("AuraMind release error:", error);
        return NextResponse.json({ error: "Could not release the plan. Check the server logs for the database error." }, { status: 500 });
      }
      if (!released) {
        return NextResponse.json({ error: "The request was found but its status was not updated. Check Supabase permissions and the request ID." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, status: released.status, readyAt: released.ready_at });
    }

    if (action === "generate-plan") {
      const gemini = getGeminiClient();
      const r = (existing.data.research ?? {}) as Record<string, unknown>;
      let plan: Record<string, any> | null = null;
      let engine: "gemini" | "demo-fallback" = "gemini";
      let fallbackReason = "";

      const prompt = [
        "You are AuraMind's schedule architect.",
        "A human researcher has prepared research for this goal. Treat the research as the primary evidence.",
        "Generate a detailed 30-day operating timetable from the research and the user's constraints.",
        "Every one of the 30 days must be present.",
        "Use concrete tasks and measurable deliverables.",
        "Respect fixed commitments, sleep and the user's available focus time.",
        "Progress through sensible phases: foundation, deliberate practice, application, review/error repair, checkpoints, and final consolidation as appropriate.",
        "Do not invent credentials or promise the goal will be achieved.",
        "Return JSON matching the provided schema.",
        JSON.stringify({
          goal: existing.data.goal,
          deadline: existing.data.deadline,
          currentLevel: existing.data.current_level,
          targetLevel: existing.data.target_level,
          fixedSchedule: existing.data.fixed_schedule,
          dailyHours: existing.data.daily_hours,
          timezone: existing.data.timezone,
          preferredFocusTime: existing.data.preferred_focus_time,
          knownDistractions: existing.data.known_distractions,
          pastAttempts: existing.data.past_attempts,
          constraints: existing.data.constraints,
          research: r
        })
      ].join("\n\n");

      if (gemini) {
        try {
          const generated = await generateGeminiJson<Record<string, any>>({
            contents: prompt,
            responseSchema: schema,
            thinkingLevel: "high",
            systemInstruction: "You are AuraMind's strict schedule architect. The human research is authoritative context. Return only valid JSON and never invent evidence."
          });

          if (!validateSchedule(generated.schedule, 30)) {
            throw new Error("Gemini returned an invalid 30-day timetable.");
          }
          plan = generated;
        } catch (generationError: any) {
          fallbackReason = typeof generationError?.message === "string"
            ? generationError.message
            : "Gemini timetable generation failed.";
          console.error("AuraMind admin timetable generation error:", generationError);
        }
      } else {
        fallbackReason = "GEMINI_API_KEY is not configured.";
      }

      // Never leave the request stuck simply because the AI provider is unavailable.
      // Generate a clearly labelled rule-based 30-day starter timetable as a fallback.
      if (!plan) {
        engine = "demo-fallback";
        const fallback = makeDemoPlan({
          goal: existing.data.goal,
          deadline: existing.data.deadline,
          currentLevel: existing.data.current_level,
          targetLevel: existing.data.target_level,
          fixedSchedule: existing.data.fixed_schedule || "",
          dailyHours: Number(existing.data.daily_hours) || 3,
          timezone: existing.data.timezone || "Asia/Kolkata"
        });

        plan = {
          ...fallback,
          engine,
          fallbackReason,
          milestones: [
            { title: "Foundation", outcome: "Establish and assess essential prerequisites.", timing: "Days 1–7" },
            { title: "Deliberate practice", outcome: "Practise core skills and record recurring errors.", timing: "Days 8–14" },
            { title: "Application and repair", outcome: "Apply skills to practical tasks and repair weak areas.", timing: "Days 15–23" },
            { title: "Consolidation", outcome: "Review evidence and complete a final checkpoint.", timing: "Days 24–30" }
          ],
          research: {
            research_summary: String(r.research_summary ?? "No saved research summary was provided. This is a rule-based starter timetable, not a research-verified plan."),
            requirements: Array.isArray(r.requirements) ? r.requirements : [],
            prerequisites: Array.isArray(r.prerequisites) ? r.prerequisites : [],
            common_bottlenecks: Array.isArray(r.common_bottlenecks) ? r.common_bottlenecks : [],
            strategy: Array.isArray(r.strategy) ? r.strategy : []
          }
        };
      }

      if (!validateSchedule(plan.schedule, 30)) {
        return NextResponse.json({ error: "AuraMind could not produce a valid 30-day timetable. Please retry." }, { status: 502 });
      }

      plan.engine = engine;
      if (fallbackReason) plan.fallbackReason = fallbackReason;
      plan.goalContext = {
        goal: existing.data.goal,
        deadline: existing.data.deadline,
        currentLevel: existing.data.current_level,
        targetLevel: existing.data.target_level,
        fixedSchedule: existing.data.fixed_schedule,
        dailyHours: existing.data.daily_hours,
        timezone: existing.data.timezone,
        preferredFocusTime: existing.data.preferred_focus_time,
        knownDistractions: existing.data.known_distractions,
        pastAttempts: existing.data.past_attempts,
        constraints: existing.data.constraints
      };

      const { error } = await db.from("goal_requests").update({
        plan,
        status: "review",
        ready_at: null
      }).eq("request_code", requestId);

      if (error) {
        console.error("AuraMind save plan error:", error);
        return NextResponse.json({ error: "Plan was generated but could not be saved." }, { status: 500 });
      }

      return NextResponse.json({ ok: true, status: "review", plan, engine, ...(fallbackReason ? { fallbackReason } : {}) });
    }
    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (error: any) {
    console.error("AuraMind admin update error:", error);
    return NextResponse.json({ error: typeof error?.message === "string" ? error.message : "Admin update failed." }, { status: 500 });
  }
}
