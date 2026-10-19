import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid } from "@/lib/http";
import { Ctx } from "@/lib/schemas";
import { calculateDailyMetrics, calculateWeeklyMetrics } from "@/lib/analysis";
import { generateDailyNarrative, generateWeeklyNarrative } from "@/lib/gemini";
import { CheckinRecord } from "@/lib/types";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { request_id, type = "daily", day = 1 } = body;

  if (!isUuid(request_id)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();

  // 1. Fetch goal context
  const rRes = await client.from("requests").select("id, context").eq("id", request_id).maybeSingle();
  const r = maybeOk(rRes);
  if (!r) return J({ error: "Goal request not found." }, 404);

  const ctx = Ctx.parse(r.context);

  // 2. Fetch check-ins
  const checkinsRes = await client
    .from("checkins")
    .select("*")
    .eq("request_id", request_id)
    .order("created_at", { ascending: true });

  const allCheckins = (maybeOk(checkinsRes) || []) as CheckinRecord[];

  if (type === "daily") {
    const dayCheckins = allCheckins.filter((c) => c.day === day);
    const metrics = calculateDailyMetrics(dayCheckins);

    let narrative = {
      coaching_summary: metrics.coaching_summary,
      tomorrow_recommendation: metrics.tomorrow_recommendation,
      practical_next_action: metrics.practical_next_action,
    };

    if (dayCheckins.length > 0) {
      try {
        narrative = await generateDailyNarrative(ctx, day, metrics, dayCheckins);
      } catch (err) {
        console.warn("[reports] Daily narrative fallback:", err);
      }
    }

    const reportContent = {
      day,
      metrics,
      narrative,
    };

    // Save to auramind_run_reports
    await client.from("auramind_run_reports").insert({
      request_id,
      report_type: "daily",
      day,
      metrics,
      content: reportContent,
    });

    return J({
      ok: true,
      report: reportContent,
    });
  }

  if (type === "weekly") {
    const weeklyCheckins = allCheckins.filter((c) => c.day > day - 7 && c.day <= day);
    const metrics = calculateWeeklyMetrics(weeklyCheckins);

    let narrative = {
      major_difficulties: metrics.major_difficulties,
      recommendations: metrics.recommendations,
      adaptation_advisory: metrics.adaptation_advisory,
    };

    if (weeklyCheckins.length >= 4) {
      try {
        narrative = await generateWeeklyNarrative(ctx, metrics, weeklyCheckins);
      } catch (err) {
        console.warn("[reports] Weekly narrative fallback:", err);
      }
    }

    const reportContent = {
      day,
      metrics,
      narrative,
    };

    // Save to auramind_run_reports
    await client.from("auramind_run_reports").insert({
      request_id,
      report_type: "weekly",
      day,
      metrics,
      content: reportContent,
    });

    return J({
      ok: true,
      report: reportContent,
    });
  }

  return J({ error: "Unsupported report type." }, 400);
});

export const GET = guard(async (req) => {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id") || url.searchParams.get("id");
  const reportType = url.searchParams.get("type") || "daily";

  if (!isUuid(requestId)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();
  const res = await client
    .from("auramind_run_reports")
    .select("*")
    .eq("request_id", requestId)
    .eq("report_type", reportType)
    .order("created_at", { ascending: false })
    .limit(10);

  const reports = maybeOk(res) || [];
  return J({ reports });
});
