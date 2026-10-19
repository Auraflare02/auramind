import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid } from "@/lib/http";
import { TimerSessionInput } from "@/lib/schemas";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = TimerSessionInput.safeParse(body);

  if (!parsed.success) {
    return J({ error: "Invalid timer session data." }, 400);
  }

  const { request_id, task_activity, duration_min, actual_duration_min, status, started_at, completed_at } = parsed.data;

  if (!isUuid(request_id)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();

  // Verify request exists
  const rRes = await client.from("requests").select("id, started_at").eq("id", request_id).maybeSingle();
  const r = maybeOk(rRes);
  if (!r) {
    return J({ error: "Goal request not found." }, 404);
  }

  // Prevent duplicate insertion of identical session within 10 seconds
  const tenSecAgo = new Date(Date.now() - 10000).toISOString();
  const dupRes = await client
    .from("auramind_focus_sessions")
    .select("id")
    .eq("request_id", request_id)
    .eq("task_activity", task_activity)
    .gte("created_at", tenSecAgo)
    .limit(1);

  const existingDups = maybeOk(dupRes);
  if (existingDups && existingDups.length > 0) {
    return J({ error: "Session already recorded." }, 409);
  }

  // Calculate XP: 1 XP per minute of focus + 15 completion bonus
  const focusedMins = Math.max(0, actual_duration_min || duration_min);
  const xpAwarded = status === "completed" ? focusedMins + 15 : Math.floor(focusedMins * 0.5);

  const insertRes = await client
    .from("auramind_focus_sessions")
    .insert({
      request_id,
      task_activity,
      duration_min,
      actual_duration_min: focusedMins,
      status,
      xp_awarded: xpAwarded,
      started_at,
      completed_at: completed_at || new Date().toISOString(),
    })
    .select("id, xp_awarded, created_at")
    .single();

  const saved = ok(insertRes);

  return J(
    {
      ok: true,
      session_id: saved.id,
      xp_awarded: saved.xp_awarded,
      message: `Focus session recorded! +${saved.xp_awarded} XP earned.`,
    },
    201
  );
});

export const GET = guard(async (req) => {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id") || url.searchParams.get("id");

  if (!isUuid(requestId)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();
  const res = await client
    .from("auramind_focus_sessions")
    .select("*")
    .eq("request_id", requestId)
    .order("started_at", { ascending: false })
    .limit(50);

  const sessions = maybeOk(res) || [];

  // Calculate today's stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = sessions.filter((s: any) => s.started_at && s.started_at.startsWith(todayStr));
  const todayFocusMin = todaySessions.reduce((acc: number, s: any) => acc + (s.actual_duration_min || s.duration_min || 0), 0);
  const todayCompletedCount = todaySessions.filter((s: any) => s.status === "completed").length;

  return J({
    sessions,
    today_stats: {
      total_sessions: todaySessions.length,
      completed_sessions: todayCompletedCount,
      total_focus_min: todayFocusMin,
    },
  });
});
