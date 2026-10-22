import { db, ok, maybeOk } from "@/lib/db";
import { J, guard, isUuid } from "@/lib/http";
import { ChatInput, Ctx } from "@/lib/schemas";
import { chatWithAuraMindAI } from "@/lib/gemini";
import { ChatMessageRecord } from "@/lib/types";

export const POST = guard(async (req) => {
  const body = await req.json().catch(() => null);
  const parsed = ChatInput.safeParse(body);

  if (!parsed.success) {
    return J({ error: "Invalid message payload.", details: parsed.error.issues }, 400);
  }

  const { request_id, conversation_id, message, history: clientHistory, enable_search } = parsed.data;

  const client = db();

  // 1. If a valid request_id is provided, retrieve goal context
  let goalContext: any = undefined;
  let serverHistory: { role: "user" | "assistant" | "model" | "system"; content: string }[] = [];

  if (request_id && isUuid(request_id)) {
    try {
      const rRes = await client
        .from("requests")
        .select("id, status, category, current_level, target_level, started_at, context, plan")
        .eq("id", request_id)
        .maybeSingle();

      const r = maybeOk(rRes);
      if (r) {
        let currentDay = 1;
        if (r.started_at) {
          currentDay = Math.min(30, Math.max(1, Math.floor((Date.now() - Date.parse(r.started_at)) / 864e5) + 1));
        }

        const todayBlocks = r.plan?.days?.[currentDay - 1]?.blocks?.map(
          (b: any) => `${b.start}-${b.end}: ${b.activity}`
        ) || [];

        // Fetch recent check-ins
        const checkinsRes = await client
          .from("checkins")
          .select("day, planned, actual, status, focused_min, reason")
          .eq("request_id", request_id)
          .order("created_at", { ascending: false })
          .limit(4);

        const recentCheckins = maybeOk(checkinsRes) || [];

        const ctx = Ctx.safeParse(r.context);
        goalContext = {
          goal: ctx.success ? ctx.data.goal : r.context?.goal,
          category: r.category || "General",
          currentLevel: r.current_level,
          targetLevel: r.target_level,
          dailyHours: ctx.success ? ctx.data.hours : 2,
          focusWindow: ctx.success ? ctx.data.focus : "morning",
          currentDay,
          todayTasks: todayBlocks,
          recentCheckins,
        };

        // Fetch stored messages if client didn't supply full history
        if (!clientHistory || clientHistory.length === 0) {
          const msgRes = await client
            .from("auramind_messages")
            .select("role, content, created_at")
            .eq("request_id", request_id)
            .order("created_at", { ascending: true })
            .limit(16);

          serverHistory = (maybeOk(msgRes) || []) as {
            role: "user" | "assistant" | "model" | "system";
            content: string;
          }[];
        }
      }
    } catch (e) {
      console.warn("[chat] Non-critical error loading goal context from database:", e);
    }
  }

  // 2. Select effective conversation history
  const historyToUse = clientHistory && clientHistory.length > 0 ? clientHistory : serverHistory;

  // 3. Generate response using Google Gemini Intelligence Engine
  let aiResult;
  try {
    aiResult = await chatWithAuraMindAI({
      userMessage: message,
      history: historyToUse,
      goalContext,
      enableWebSearch: Boolean(enable_search),
    });
  } catch (err: any) {
    console.error("[chat] Gemini AI generation error:", err.message);
    return J(
      {
        ok: false,
        error: err.message || "Failed to generate AI response. Please retry.",
      },
      503
    );
  }

  // 4. Persist messages in database if a valid request_id is present
  if (request_id && isUuid(request_id)) {
    try {
      const nowIso = new Date().toISOString();
      await client.from("auramind_messages").insert([
        { request_id, role: "user", content: message, created_at: nowIso },
        { request_id, role: "assistant", content: aiResult.reply, created_at: new Date(Date.now() + 50).toISOString() },
      ]);
    } catch (dbErr) {
      console.warn("[chat] Could not persist message to database:", dbErr);
    }
  }

  return J({
    ok: true,
    reply: aiResult.reply,
    sources: aiResult.sources,
    model: aiResult.modelUsed,
  });
});

export const GET = guard(async (req) => {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id") || url.searchParams.get("id");

  if (!requestId || !isUuid(requestId)) {
    return J({ messages: [] });
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
