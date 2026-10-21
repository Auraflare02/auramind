import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid, generateSessionToken } from "@/lib/http";
import { Ctx, Plan } from "@/lib/schemas";
import { fallbackPlan } from "@/lib/fallback";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { id } = body;

  if (!isUuid(id)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();

  // 1. Verify request and retrieve status
  const rRes = await client
    .from("requests")
    .select("id, status, plan, started_at, session_token, context")
    .eq("id", id)
    .maybeSingle();

  const r = maybeOk(rRes);
  if (!r) {
    return J({ error: "Goal request not found." }, 404);
  }

  const nowIso = new Date().toISOString();

  // If plan was not generated yet, generate it instantly
  if (r.status !== "ready" || !r.plan) {
    const ctx = Ctx.parse(r.context);
    const plan = fallbackPlan(ctx);
    await client
      .from("requests")
      .update({
        status: "ready",
        plan,
        plan_source: "fallback",
        ready_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", id);
    r.plan = plan;
    r.status = "ready";
  }

  // 2. If already started, reuse existing session (Idempotent)
  if (r.started_at && r.session_token) {
    const runRes = await client
      .from("auramind_goal_runs")
      .select("*")
      .eq("request_id", id)
      .maybeSingle();

    const existingRun = maybeOk(runRes);
    if (!existingRun) {
      await client.from("auramind_goal_runs").insert({
        request_id: id,
        session_token: r.session_token,
        current_day: 1,
        total_xp: 50,
      });
    }

    return J({
      ok: true,
      message: "Resuming existing active goal session.",
      session_token: r.session_token,
      started_at: r.started_at,
    });
  }

  // 3. New Goal Run Session initialization
  const sessionToken = generateSessionToken();

  // Update requests table
  const updateRes = await client
    .from("requests")
    .update({
      started_at: nowIso,
      session_token: sessionToken,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select("id, started_at, session_token")
    .maybeSingle();

  ok(updateRes);

  // Create persistent goal run record
  await client
    .from("auramind_goal_runs")
    .insert({
      request_id: id,
      session_token: sessionToken,
      current_day: 1,
      total_xp: 50, // Welcome kickoff bonus
      unlocked_achievements: ["goal_initiated"],
      started_at: nowIso,
    })
    .select()
    .maybeSingle();

  return J({
    ok: true,
    message: "Goal started! Day 1 commences now.",
    session_token: sessionToken,
    started_at: nowIso,
  });
});
