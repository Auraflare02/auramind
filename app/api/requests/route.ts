import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid, isRequestCode, generateRequestCode } from "@/lib/http";
import { Ctx } from "@/lib/schemas";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => null);
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
  const client = db();

  const insertRes = await client
    .from("requests")
    .insert({
      request_code: requestCode,
      status: "pending",
      category,
      current_level,
      target_level,
      timezone,
      context: p.data,
    })
    .select("id, request_code, status, created_at")
    .single();

  const row = ok(insertRes);

  return J(
    {
      id: row.id,
      request_code: row.request_code,
      status: row.status,
      created_at: row.created_at,
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
    plan: r.status === "ready" ? r.plan : null,
    has_plan: Boolean(r.plan),
    has_session: Boolean(r.started_at),
  });
});
