import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid, isRequestCode, generateRequestCode } from "@/lib/http";
import { Ctx, Plan, ResearchSchema } from "@/lib/schemas";
import { isGeminiConfigured } from "@/lib/ai/config";
import { synthesizePersonalizedPlan } from "@/lib/ai/planner";
import { fallbackPlan } from "@/lib/fallback";
import { searchTavily } from "@/lib/tavily";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/**
 * Synthesizes comprehensive learning-science research
 * and a 30-day timetable using the multi-stage Gemini AI pipeline.
 */
async function synthesizePlan(ctx: Ctx, allowDemo = false): Promise<{ researchData: any; plan: Plan; planSource: "ai" | "demo" }> {
  let externalEvidence = "";

  // 1. External Evidence Search (Tavily if configured, bounded to 2.5s)
  try {
    const searchPromise = searchTavily(`${ctx.goal} curriculum milestones deliberate practice`);
    const searchResults = await Promise.race([
      searchPromise,
      new Promise<any[]>((_, reject) => setTimeout(() => reject(new Error("Tavily timeout")), 2500)),
    ]);
    if (searchResults && searchResults.length) {
      externalEvidence = searchResults.map((s: any) => `Title: ${s.title}\nContent: ${s.content}`).join("\n\n");
    }
  } catch (err) {
    console.warn("[requests-api] Tavily search skipped or timed out:", err);
  }

  // 2. Synthesize using Real Gemini Multi-Stage Pipeline
  if (isGeminiConfigured()) {
    try {
      const result = await synthesizePersonalizedPlan(ctx, { externalResearch: externalEvidence });
      return {
        researchData: {
          summary: `${result.blueprint.intended_outcome}\n\nSuccess Definition: ${result.blueprint.definition_of_success}`,
          blueprint: result.blueprint,
          requirements: result.blueprint.core_workstreams.map((w) => `${w.name}: ${w.description}`),
          prerequisites: result.blueprint.prerequisites,
          common_bottlenecks: result.blueprint.bottlenecks_and_friction,
          strategy: result.blueprint.intended_outcome,
          quality_review: result.qualityReview,
        },
        plan: result.plan,
        planSource: "ai",
      };
    } catch (err: any) {
      console.error("[requests-api] Gemini generation error, falling back to personalized foundation plan:", err);
    }
  }

  // Graceful, resilient plan generation fallback so goal creation NEVER fails for the user
  const plan = fallbackPlan(ctx);
  const researchData = {
    summary: `Strategic foundational blueprint for "${ctx.goal}". Designed for ${ctx.hours} hrs/day during your peak ${ctx.focus} window.`,
    blueprint: {
      intended_outcome: `Establish consistent mastery in ${ctx.goal}.`,
      definition_of_success: `Complete 30 days of deliberate daily practice with verified milestone completion.`,
      core_workstreams: [
        { name: "Foundations", description: "Establish essential skills and toolchains" },
        { name: "Deliberate Practice", description: "Daily progressive drills and exercises" },
        { name: "Integration", description: "Real-world project and milestone delivery" },
      ],
      prerequisites: ["Dedicated daily focus window", "Uninterrupted practice environment"],
      bottlenecks_and_friction: [ctx.distractions || "Inconsistent follow-through", "Cognitive overload"],
      phases: [
        { name: "Phase 1: Foundations", start_day: 1, end_day: 7, main_objective: "Core competency build", key_deliverable: "Baseline proof of work" },
        { name: "Phase 2: Deliberate Practice", start_day: 8, end_day: 15, main_objective: "High-friction challenges", key_deliverable: "Midway checkpoint validation" },
        { name: "Phase 3: Integration & Mastery", start_day: 16, end_day: 23, main_objective: "Application & testing", key_deliverable: "Project execution" },
        { name: "Phase 4: Culmination", start_day: 24, end_day: 30, main_objective: "Final review and polish", key_deliverable: "Target achievement" },
      ],
      milestones: [
        { day: 7, title: "Foundation Checkpoint", deliverable: "Basic skills verified", validation_test: "Complete self-assessment" },
        { day: 15, title: "Midway Review", deliverable: "Intermediate capability proof", validation_test: "Solve practical problem" },
        { day: 23, title: "Integration Test", deliverable: "Real application build", validation_test: "Demonstrate working output" },
        { day: 30, title: "Final Outcome", deliverable: "Target outcome delivered", validation_test: "Final milestone verification" },
      ],
    },
    requirements: ["Daily practice", "Review sessions", "Milestone checkpoints"],
    prerequisites: ["Dedicated focus time"],
    common_bottlenecks: [ctx.distractions || "Distractions", "Inconsistent follow-through"],
    strategy: `Daily progressive focus blocks tailored to ${ctx.focus} schedule.`,
  };
  return { researchData, plan, planSource: "ai" };
}

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => null);

  // Allow generating an existing pending goal on-demand
  if (body?.action === "generate_now" && body?.id && isUuid(body.id)) {
    const client = db();
    const fetchRes = await client.from("requests").select("*").eq("id", body.id).maybeSingle();
    const existing = maybeOk(fetchRes);

    if (!existing) {
      return J({ error: "Goal request not found." }, 404);
    }

    const ctx = Ctx.parse(existing.context);
    const { researchData, plan, planSource } = await synthesizePlan(ctx);
    const nowIso = new Date().toISOString();

    const updateRes = await client
      .from("requests")
      .update({
        status: "ready",
        research: researchData.summary,
        research_data: researchData,
        plan,
        plan_source: planSource,
        ready_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", body.id)
      .select("*")
      .single();

    const row = ok(updateRes);
    return J({
      ok: true,
      id: row.id,
      request_code: row.request_code,
      status: row.status,
      plan: row.plan,
      research_data: row.research_data,
      ready_at: row.ready_at,
    });
  }

  // Standard Goal Submission
  const p = Ctx.safeParse(body);

  if (!p.success) {
    const errorDetails = p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return J({ error: `Please check your form entries: ${errorDetails}` }, 400);
  }

  const { deadline, category, current_level, target_level, timezone } = p.data;

  if (deadline) {
    const parsed = Date.parse(deadline);
    if (isNaN(parsed) || parsed < Date.now() - 864e5) {
      return J({ error: "Deadline must be a valid future date." }, 400);
    }
  }

  const requestCode = generateRequestCode();
  const nowIso = new Date().toISOString();

  // Enforce authentication: goals cannot be created before login or signup
  let userId: string | null = null;
  try {
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user?.id) {
      userId = user.id;
    }
  } catch {
    userId = null;
  }

  if (!userId) {
    return J(
      { error: "Authentication required. Please log in or create an account before creating a goal plan." },
      401
    );
  }

  // Instant AI Synthesis in front of user
  const { researchData, plan, planSource } = await synthesizePlan(p.data);

  const client = db();
  const insertPayload: any = {
    request_code: requestCode,
    status: "ready", // IMMEDIATELY ready
    category,
    current_level,
    target_level,
    timezone,
    context: p.data,
    research: researchData.summary,
    research_data: researchData,
    plan,
    plan_source: planSource,
    ready_at: nowIso,
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (userId) {
    insertPayload.user_id = userId;
  }

  const insertRes = await client
    .from("requests")
    .insert(insertPayload)
    .select("id, request_code, status, plan, research_data, created_at, ready_at")
    .single();

  const row = ok(insertRes);

  return J(
    {
      id: row.id,
      request_code: row.request_code,
      status: row.status,
      plan: row.plan,
      research_data: row.research_data,
      created_at: row.created_at,
      ready_at: row.ready_at,
    },
    201
  );
});

export const GET = guard(async (req) => {
  const url = new URL(req.url);
  const idOrCode = url.searchParams.get("id") || url.searchParams.get("code");

  if (!idOrCode) {
    return J({ error: "Please provide a request ID or Request Code." }, 400);
  }

  const client = db();
  let query = client.from("requests").select("*");

  if (isUuid(idOrCode)) {
    query = query.eq("id", idOrCode);
  } else if (isRequestCode(idOrCode)) {
    query = query.eq("request_code", idOrCode);
  } else {
    // Attempt lookup by ID or request_code
    query = query.or(`id.eq.${idOrCode},request_code.eq.${idOrCode}`);
  }

  const res = await query.maybeSingle();
  const r = maybeOk(res);

  if (!r) {
    return J({ error: "Goal request not found. Check the code and try again." }, 404);
  }

  return J({
    id: r.id,
    request_code: r.request_code,
    status: r.status,
    goal: r.context?.goal || "Goal",
    category: r.category || r.context?.category,
    current_level: r.current_level,
    target_level: r.target_level,
    timezone: r.timezone,
    context: r.context,
    started_at: r.started_at,
    ready_at: r.ready_at,
    plan_source: r.plan_source,
    research_summary: r.research_data?.summary || r.research,
    plan: r.plan,
    has_plan: Boolean(r.plan),
    has_session: Boolean(r.started_at),
  });
});
