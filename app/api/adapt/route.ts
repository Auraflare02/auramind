import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid } from "@/lib/http";
import { Ctx, Plan } from "@/lib/schemas";
import { generateAdaptiveSchedule } from "@/lib/gemini";
import { CheckinRecord } from "@/lib/types";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { request_id, start_day = 8 } = body;

  if (!isUuid(request_id)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();

  // 1. Fetch current request & timetable
  const rRes = await client
    .from("requests")
    .select("id, context, plan")
    .eq("id", request_id)
    .maybeSingle();

  const r = maybeOk(rRes);
  if (!r || !r.plan) {
    return J({ error: "Plan not found for this goal." }, 404);
  }

  const ctx = Ctx.parse(r.context);
  const plan = Plan.parse(r.plan);

  // 2. Fetch recent check-ins
  const checkinsRes = await client
    .from("checkins")
    .select("*")
    .eq("request_id", request_id)
    .order("created_at", { ascending: true });

  const checkins = (maybeOk(checkinsRes) || []) as CheckinRecord[];

  // 3. Generate adaptive schedule with Gemini
  const adaptiveProposal = await generateAdaptiveSchedule(ctx, Number(start_day), checkins, plan.days);

  // 4. Update the days in the active plan
  const adjustedDaysMap = new Map(adaptiveProposal.adjusted_days.map((d) => [d.day, d]));
  const updatedDays = plan.days.map((d) => (adjustedDaysMap.has(d.day) ? adjustedDaysMap.get(d.day)! : d));

  const updatedPlan = {
    ...plan,
    days: updatedDays,
  };

  // Persist updated plan to requests
  await client
    .from("requests")
    .update({
      plan: updatedPlan,
      updated_at: new Date().toISOString(),
    })
    .eq("id", request_id);

  // Record in auramind_goal_runs
  await client
    .from("auramind_goal_runs")
    .update({
      adaptive_plan: adaptiveProposal,
      updated_at: new Date().toISOString(),
    })
    .eq("request_id", request_id);

  return J({
    ok: true,
    message: "Upcoming 7-day schedule successfully adapted to your recorded behavior.",
    adaptive_proposal: adaptiveProposal,
    updated_plan: updatedPlan,
  });
});
