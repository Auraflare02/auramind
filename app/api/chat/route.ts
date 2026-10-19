import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid } from "@/lib/http";
import { ChatInput, Ctx } from "@/lib/schemas";
import { chatWithAuraMind } from "@/lib/gemini";
import { ChatMessageRecord } from "@/lib/types";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = ChatInput.safeParse(body);

  if (!parsed.success) {
    return J({ error: "Invalid message payload." }, 400);
  }

  const { request_id, message } = parsed.data;

  if (!isUuid(request_id)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();

  // 1. Retrieve goal record
  const rRes = await client
    .from("requests")
    .select("id, status, started_at, context, plan")
    .eq("id", request_id)
    .maybeSingle();

  const r = maybeOk(rRes);
  if (!r) {
    return J({ error: "Goal request not found." }, 404);
  }

  const ctx = Ctx.parse(r.context);

  // 2. Fetch past conversation history
  const msgRes = await client
    .from("auramind_messages")
    .select("role, content, created_at")
    .eq("request_id", request_id)
    .order("created_at", { ascending: true })
    .limit(20);

  const history = (maybeOk(msgRes) || []) as { role: "user" | "assistant" | "system"; content: string }[];

  // 3. Fetch recent checkins and focus session stats
  const checkinsRes = await client
    .from("checkins")
    .select("day, planned, actual, status, focused_min, reason")
    .eq("request_id", request_id)
    .order("created_at", { ascending: false })
    .limit(6);

  const recentCheckins = maybeOk(checkinsRes) || [];

  // Determine current day
  let currentDay = 1;
  if (r.started_at) {
    currentDay = Math.min(30, Math.max(1, Math.floor((Date.now() - Date.parse(r.started_at)) / 864e5) + 1));
  }

  const todayBlocks = r.plan?.days?.[currentDay - 1]?.blocks?.map((b: any) => `${b.start}-${b.end}: ${b.activity}`) || [];

  // 4. Generate AI Response
  let reply = "";
  try {
    reply = await chatWithAuraMind(ctx, history, message, {
      currentDay,
      todayTasks: todayBlocks,
      recentCheckins,
    });
  } catch (err) {
    console.error("[chat] AI generation error:", err);
    reply = "I experienced a temporary connection hiccup with Gemini. Your goal context is safe. Please ask again in a moment.";
  }

  // 5. Persist messages in auramind_messages
  const nowIso = new Date().toISOString();
  await client.from("auramind_messages").insert([
    { request_id, role: "user", content: message, created_at: nowIso },
    { request_id, role: "assistant", content: reply, created_at: new Date(Date.now() + 100).toISOString() },
  ]);

  return J({
    ok: true,
    reply,
  });
});

export const GET = guard(async (req) => {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id") || url.searchParams.get("id");

  if (!isUuid(requestId)) {
    return J({ error: "Invalid request ID." }, 400);
  }

  const client = db();
  const res = await client
    .from("auramind_messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
    .limit(100);

  const messages = (maybeOk(res) || []) as ChatMessageRecord[];

  return J({ messages });
});
