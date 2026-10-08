import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServerDb } from "../../../lib/server-db";
import { cleanString, clampNumber, validateHourLog } from "../../../lib/validation";

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const db = getServerDb();
  if (!db) return errorResponse("AuraMind session storage is not configured.", 503);

  const token = request.headers.get("x-session-token")?.trim() || "";
  const body = await request.json().catch(() => ({}));
  const action = cleanString(body?.action, 40);

  try {
    if (!token && action === "create") {
      const requestCode = cleanString(body?.requestId, 40).toUpperCase();
      if (!requestCode) return errorResponse("Request ID is required.");

      const { data: source, error: sourceError } = await db
        .from("goal_requests")
        .select("request_code,status,plan")
        .eq("request_code", requestCode)
        .maybeSingle();

      if (sourceError) throw sourceError;
      if (!source || source.status !== "ready" || !source.plan) {
        return errorResponse("This goal is not ready to start.", 409);
      }

      const accessToken = crypto.randomBytes(32).toString("base64url");
      const { data: run, error } = await db
        .from("auramind_goal_runs")
        .insert({
          access_token: accessToken,
          request_code: requestCode,
          plan: source.plan,
          status: "active"
        })
        .select("access_token,plan,status")
        .single();

      if (error) throw error;
      return NextResponse.json({
        sessionToken: run.access_token,
        plan: run.plan,
        status: run.status
      });
    }

    if (!token) return errorResponse("Session token is required.", 401);

    const { data: run, error: runError } = await db
      .from("auramind_goal_runs")
      .select("id,request_code,plan,status,created_at,updated_at")
      .eq("access_token", token)
      .maybeSingle();

    if (runError) throw runError;
    if (!run) return errorResponse("Session not found.", 404);

    if (action === "log") {
      const log = body?.log;
      if (!validateHourLog(log)) return errorResponse("Invalid check-in data.");

      const payload = {
        run_id: run.id,
        logged_for: cleanString(log.date, 20),
        hour_start: cleanString(log.hourStart, 30),
        hour_end: cleanString(log.hourEnd, 30),
        planned_activity: cleanString(log.plannedActivity, 800),
        actual_activity: cleanString(log.actualActivity, 800),
        outcome: cleanString(log.outcome, 20),
        focused_minutes: clampNumber(log.focusedMinutes, 0, 60, 0),
        distraction_minutes: clampNumber(log.distractionMinutes, 0, 60, 0),
        distraction_category: cleanString(log.distractionCategory, 120) || null,
        distraction_reason: cleanString(log.distractionReason, 200) || null,
        notes: cleanString(log.notes, 1000) || null
      };

      const { error } = await db
        .from("auramind_run_logs")
        .upsert(payload, { onConflict: "run_id,logged_for,hour_start" });

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "report") {
      const reportType = cleanString(body?.reportType, 30).toLowerCase();
      const reportKey = cleanString(body?.reportKey, 30);
      if (!["daily", "weekly", "adaptive"].includes(reportType) || !reportKey) {
        return errorResponse("Invalid report data.");
      }
      if (JSON.stringify(body?.payload ?? {}).length > 30000) {
        return errorResponse("Report payload is too large.");
      }

      const { error } = await db.from("auramind_run_reports").upsert(
        {
          run_id: run.id,
          report_type: reportType,
          report_key: reportKey,
          payload: body?.payload ?? {}
        },
        { onConflict: "run_id,report_type,report_key" }
      );

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return errorResponse("Unknown session action.");
  } catch (error) {
    console.error("AuraMind session write error:", error);
    return errorResponse("Could not save session data.", 500);
  }
}

export async function GET(request: Request) {
  const db = getServerDb();
  if (!db) return errorResponse("AuraMind session storage is not configured.", 503);

  const token = request.headers.get("x-session-token")?.trim() || "";
  if (!token) return errorResponse("Session token is required.", 401);

  try {
    const { data: run, error: runError } = await db
      .from("auramind_goal_runs")
      .select("id,request_code,plan,status,created_at,updated_at")
      .eq("access_token", token)
      .maybeSingle();

    if (runError) throw runError;
    if (!run) return errorResponse("Session not found.", 404);

    const [{ data: logs }, { data: reports }, { data: messages }] = await Promise.all([
      db.from("auramind_run_logs").select("*").eq("run_id", run.id).order("logged_for", { ascending: true }).limit(5000),
      db.from("auramind_run_reports").select("report_type,report_key,payload,created_at").eq("run_id", run.id).order("created_at", { ascending: true }).limit(500),
      db.from("auramind_messages").select("role,content,created_at").eq("run_id", run.id).order("created_at", { ascending: false }).limit(20)
    ]);

    return NextResponse.json({
      sessionToken: token,
      requestCode: run.request_code,
      plan: run.plan,
      status: run.status,
      logs: logs ?? [],
      reports: reports ?? [],
      messages: (messages ?? []).reverse(),
      createdAt: run.created_at,
      updatedAt: run.updated_at
    });
  } catch (error) {
    console.error("AuraMind session read error:", error);
    return errorResponse("Could not load session.", 500);
  }
}
