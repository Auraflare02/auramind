import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid } from "@/lib/http";
import { Checkin, Ctx } from "@/lib/schemas";
import { calculateDailyMetrics, calculateWeeklyMetrics } from "@/lib/analysis";
import { generateCheckinCoaching } from "@/lib/gemini";
import { CheckinRecord } from "@/lib/types";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => null);
  const p = Checkin.safeParse(body);

  if (!p.success) {
    const errorDetails = p.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    return J({ error: `Please verify your check-in fields: ${errorDetails}` }, 400);
  }

  const { id: requestId, ...c } = p.data;
  if (!isUuid(requestId)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();

  // Verify request is active
  const rRes = await client
    .from("requests")
    .select("id, status, started_at, context")
    .eq("id", requestId)
    .maybeSingle();

  const r = maybeOk(rRes);
  if (!r) {
    return J({ error: "Goal not found." }, 404);
  }

  if (!r.started_at) {
    return J({ error: "Please start your 30-day goal before recording check-ins." }, 409);
  }

  // Prevent duplicate submissions within 60 seconds for same planned task
  const recentThreshold = new Date(Date.now() - 60000).toISOString();
  const dupRes = await client
    .from("checkins")
    .select("id")
    .eq("request_id", requestId)
    .eq("day", c.day)
    .eq("planned", c.planned)
    .gte("created_at", recentThreshold)
    .limit(1);

  const existingDups = maybeOk(dupRes);
  if (existingDups && existingDups.length > 0) {
    return J({ error: "This task was already logged a moment ago." }, 409);
  }

  // Insert check-in
  const insertRes = await client
    .from("checkins")
    .insert({
      request_id: requestId,
      day: c.day,
      planned: c.planned,
      actual: c.actual || c.planned,
      status: c.status,
      focused_min: c.focused_min,
      distraction_min: c.distraction_min,
      distraction_type: c.distraction_type || null,
      reason: c.reason || null,
      period: c.period,
      notes: c.notes || null,
    })
    .select("id, created_at")
    .single();

  const savedCheckin = ok(insertRes);

  // Generate personalized coaching
  const ctx = Ctx.parse(r.context);
  let coaching = "";
  try {
    coaching = await generateCheckinCoaching(ctx, c);
  } catch (err) {
    console.warn("[checkin] Coaching generation failed:", err);
    coaching = c.status === "done"
      ? "Great execution! Note what enabled this focus so you can replicate it tomorrow."
      : "Session logged as a diagnostic signal. Take a 5-minute break and reset for the next block.";
  }

  // Update XP in goal run
  try {
    const xpToAdd = c.status === "done" ? 25 : c.status === "different" ? 15 : 10;
    await client.rpc("increment_goal_xp", { p_request_id: requestId, p_xp: xpToAdd });
  } catch {
    // If stored procedure doesn't exist, ignore
  }

  return J(
    {
      ok: true,
      checkin_id: savedCheckin.id,
      coaching,
    },
    201
  );
});

export const GET = guard(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const dayParam = url.searchParams.get("day");

  if (!isUuid(id)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const day = dayParam ? Number(dayParam) : 1;
  const client = db();

  const res = await client
    .from("checkins")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const checkins = (maybeOk(res) || []) as CheckinRecord[];
  const dayCheckins = checkins.filter((c) => c.day === day);
  const weeklyCheckins = checkins.filter((c) => c.day > day - 7 && c.day <= day);

  const daily = calculateDailyMetrics(dayCheckins);
  const weekly = calculateWeeklyMetrics(weeklyCheckins);

  return J({
    day,
    checkins: dayCheckins,
    all_checkins_count: checkins.length,
    daily,
    weekly,
  });
});
