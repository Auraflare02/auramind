import { NextResponse } from "next/server";
import { generateGeminiJson, getGeminiClient } from "../../../lib/ai";
import { calculateXp } from "../../../lib/xp";

const schema = {
  type: "object",
  properties: {
    responseType: { type: "string", enum: ["continue", "recover", "reschedule"] },
    diagnosis: { type: "string" },
    immediateSolution: { type: "string" },
    nextAction: { type: "string" },
    coachMessage: { type: "string" }
  },
  required: ["responseType", "diagnosis", "immediateSolution", "nextAction", "coachMessage"]
} as const;

function coreCoach(log: any) {
  const distraction = String(log?.distractionCategory || "").trim();
  const reason = String(log?.distractionReason || "").trim();
  const focused = Math.max(0, Number(log?.focusedMinutes || 0));
  const outcome = String(log?.outcome || "");

  if (outcome === "completed" && focused >= 25 && !distraction) {
    return {
      responseType: "continue",
      diagnosis: "The planned block was completed with meaningful focus.",
      immediateSolution: "Do not add extra work just because you finished well. Protect the recovery window.",
      nextAction: "Write one sentence about what made this block work and start the next planned block when scheduled.",
      coachMessage: "Good execution. AuraMind is tracking what worked so the plan can preserve it."
    };
  }

  if (/difficult|understand/i.test(reason)) {
    return {
      responseType: "recover",
      diagnosis: "The task appears to be the blocker, not simply lack of effort.",
      immediateSolution: "Shrink the task to the smallest useful step: one concept, one example, or 5 questions.",
      nextAction: "Record the exact point that caused the block, then attempt only that smaller step.",
      coachMessage: "Let's reduce the task before changing your whole schedule."
    };
  }

  if (/tired|sleep/i.test(reason)) {
    return {
      responseType: "reschedule",
      diagnosis: "Fatigue appears to be affecting the current focus window.",
      immediateSolution: "Switch to a lighter task for this block and move the hardest work to a stronger period.",
      nextAction: "Take the planned recovery break, then do one small low-load action rather than forcing a long session.",
      coachMessage: "The schedule should adapt to your energy instead of treating fatigue as a character flaw."
    };
  }

  if (distraction) {
    return {
      responseType: "recover",
      diagnosis: "The hour included " + distraction + (reason ? " because of " + reason.toLowerCase() + "." : "."),
      immediateSolution: "Change the environment before the next block so the same trigger is harder to reach.",
      nextAction: "Start with a 10-minute restart on the planned task and continue only if focus returns.",
      coachMessage: "You don't need to restart the whole day. Recover the next block."
    };
  }

  return {
    responseType: outcome === "skipped" ? "reschedule" : "continue",
    diagnosis: "The check-in does not yet show enough evidence for a strong diagnosis.",
    immediateSolution: "Make the next task smaller and more concrete.",
    nextAction: "Complete one measurable step and log the result.",
    coachMessage: "One hour is data. Let's use the next hour to learn more."
  };
}

export async function POST(request: Request) {
  let log: any = null;
  try {
    const body = await request.json();
    log = body?.log ?? null;
    const plan = body?.plan ?? null;
    const recentLogs = Array.isArray(body?.recentLogs) ? body.recentLogs.slice(-24) : [];

    if (!log) {
      return NextResponse.json({ error: "Check-in data is required." }, { status: 400 });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      return NextResponse.json({
        ...coreCoach(log),
        xp: calculateXp(log).earned,
        engine: "core"
      });
    }

    const result = await generateGeminiJson<{
      responseType: "continue" | "recover" | "reschedule";
      diagnosis: string;
      immediateSolution: string;
      nextAction: string;
      coachMessage: string;
    }>({
      contents: [
        "A user just checked in after one planned hour.",
        "Respond to what actually happened, not what should have happened.",
        "Do not shame the user or call them lazy.",
        "When the task is difficult or unclear, change the task shape before blaming motivation.",
        "When fatigue is present, reduce cognitive load and move harder work when appropriate.",
        "Use recent logs only as context; one hour is not enough to declare a long-term pattern.",
        JSON.stringify({ plan, log, recentLogs })
      ].join("\n\n"),
      responseSchema: schema,
      thinkingLevel: "low",
      systemInstruction: "You are AuraMind's real-time accountability coach. Be precise, practical, humane and concise."
    });

    return NextResponse.json({
      ...result,
      xp: calculateXp(log).earned,
      engine: "gemini"
    });

  } catch (error: any) {
    console.error("AuraMind check-in AI error; using Core fallback:", error);
    return NextResponse.json({
      ...coreCoach(log ?? {}),
      xp: calculateXp(log ?? {}).earned,
      engine: "core",
      degraded: true
    });
  }
}
