import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid, isRequestCode, generateRequestCode } from "@/lib/http";
import { Ctx, Plan, ResearchSchema } from "@/lib/schemas";
import { researchGoal, generatePlan, isGeminiConfigured } from "@/lib/gemini";
import { fallbackPlan } from "@/lib/fallback";
import { searchTavily } from "@/lib/tavily";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

/**
 * Instantly synthesizes comprehensive learning-science research
 * and an exact 30-day timetable using Gemini AI with robust deterministic fallback.
 */
async function synthesizePlan(ctx: Ctx): Promise<{ researchData: any; plan: Plan; planSource: "ai" | "fallback" }> {
  let researchData: any = null;
  let externalEvidence = "";

  // 1. External Evidence Search (Tavily if configured)
  try {
    const searchResults = await searchTavily(`${ctx.goal} curriculum milestones deliberate practice`);
    if (searchResults.length) {
      externalEvidence = searchResults.map((s) => `Title: ${s.title}\nContent: ${s.content}`).join("\n\n");
    }
  } catch (err) {
    console.warn("[requests-api] Tavily search skipped:", err);
  }

  // 2. Deep Pedagogical Research Breakdown
  if (isGeminiConfigured()) {
    try {
      researchData = await Promise.race([
        researchGoal(ctx, externalEvidence),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Research timeout")), 12000)),
      ]);
    } catch (err) {
      console.warn("[requests-api] Gemini research error or timeout, using structured fallback:", err);
    }
  }

  if (!researchData) {
    researchData = {
      summary: `Structured pedagogical roadmap for ${ctx.goal}. Balances foundation acquisition with deliberate practice drills.`,
      requirements: ["Daily focused practice", "Active retrieval drills", "Milestone checkpoints"],
      prerequisites: ["Foundational domain awareness"],
      common_bottlenecks: ["Passive consumption over active exercises", "Fatigue during unstructured hours"],
      strategy: "30-day phased architecture: Days 1-7 Foundation, 8-15 Deliberate Practice, 16-22 Application, 23-27 Error Repair, 28-30 Consolidation.",
      sources: ["Cognitive Load Theory", "Spaced Retrieval Practice Standards"],
    };
  }

  // 3. 30-Day Phased Curriculum Synthesis
  let plan: Plan;
  let planSource: "ai" | "fallback" = "ai";

  if (isGeminiConfigured()) {
    try {
      plan = await Promise.race([
        generatePlan(ctx, researchData.summary),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Plan generation timeout")), 25000)),
      ]);
      planSource = "ai";
    } catch (err) {
      console.warn("[requests-api] Gemini plan generation failed or timed out, invoking deterministic planner:", err);
      plan = fallbackPlan(ctx);
      planSource = "fallback";
    }
  } else {
    plan = fallbackPlan(ctx);
    planSource = "fallback";
  }

  return { researchData, plan, planSource };
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

  // Check if session belongs to an authenticated user
  let userId: string | null = null;
  try {
    const supabaseServer = createServerClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (user?.id) {
      userId = user.id;
    }
  } catch {
    // Unauthenticated anonymous goal creation allowed via requestCode
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
