import { NextResponse } from "next/server";
import { generateGeminiJson, getGeminiClient } from "../../../../lib/ai";
import { validateSchedule, dateAdd } from "../../../../lib/validation";
import { makeDemoPlan } from "../../../../lib/demo-engine";

const schema = {
  type: "object",
  properties: {
    adaptationSummary: { type: "string" },
    changes: { type: "array", items: { type: "string" } },
    weekly_focus: { type: "string" },
    success_definition: { type: "string" },
    schedule: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "string" },
          date: { type: "string" },
          blocks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                start: { type: "string" },
                end: { type: "string" },
                activity: { type: "string" },
                category: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                reason: { type: "string" }
              },
              required: ["start", "end", "activity", "category", "priority", "reason"]
            }
          }
        },
        required: ["day", "date", "blocks"]
      }
    }
  },
  required: ["adaptationSummary", "changes", "weekly_focus", "success_definition", "schedule"]
} as const;

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();

    const plan = body?.plan ?? null;
    const weeklyReport = body?.weeklyReport ?? null;
    const logs = Array.isArray(body?.logs) ? body.logs : [];
    const context = plan?.goalContext ?? body?.goalContext ?? null;

    if (!plan) {
      return NextResponse.json({ error: "Current plan is required." }, { status: 400 });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      const fallback = makeDemoPlan({
        goal: String(plan.goal_summary ?? ""),
        deadline: String(context?.deadline ?? ""),
        currentLevel: String(context?.currentLevel ?? ""),
        targetLevel: String(context?.targetLevel ?? ""),
        fixedSchedule: String(context?.fixedSchedule ?? ""),
        dailyHours: Number(context?.dailyHours ?? 3),
        timezone: String(context?.timezone ?? "Asia/Kolkata")
      });
      return NextResponse.json({
        adaptationSummary: "Core adaptation generated a fresh week from the available constraints.",
        changes: [
          "Reduce or move work in periods with repeated low focus.",
          "Protect the strongest recurring time window for harder work.",
          "Keep tasks concrete and measurable rather than increasing workload automatically."
        ],
        weekly_focus: fallback.weekly_focus,
        success_definition: fallback.success_definition,
        schedule: fallback.schedule.slice(0, 7).map((day: any, index: number) => ({
          ...day,
          day: "Day " + (index + 1),
          date: dateAdd(nextStart, index)
        })),
        engine: "core"
      });
    }

    const baseDate = weeklyReport?.weekEnd || plan?.schedule?.at(-1)?.date || new Date().toISOString().slice(0, 10);
    const nextStart = dateAdd(String(baseDate), 1);

    const nextDates = Array.from({ length: 7 }, (_, i) => dateAdd(nextStart, i));

    const prompt = [
      "You are AuraMind's Adaptive Planning Engine.",
      "The user has completed a week of an active goal.",
      "Use the old plan, weekly behavioral report, and raw self-reported logs to rebuild the NEXT 7 DAYS.",
      "This is not a cosmetic rewrite. Change task timing, task size, difficulty, or sequence when evidence supports it.",
      "Never punish the user by removing sleep, meals, recovery, or essential commitments.",
      "Do not call a user lazy. Treat behavior as evidence about the system.",
      "Only call something a recurring pattern if multiple days/entries support it.",
      "Protect strong focus windows for demanding work. Move lighter tasks to weaker windows.",
      "If the user struggled because tasks were too difficult, reduce task size or add prerequisites before increasing workload.",
      "If the user was consistently underloaded and completing work comfortably, modestly increase difficulty rather than blindly adding hours.",
      "Every focus block must have a concrete deliverable.",
      "Return only JSON matching the schema.",
      JSON.stringify({
        currentPlan: plan,
        goalContext: context,
        targetDates: nextDates,
        weeklyReport,
        recentLogs: logs.slice(-168)
      })
    ].join("\n\n");

    const result = await generateGeminiJson<Record<string, any>>({
      contents: prompt,
      responseSchema: schema,
      thinkingLevel: "high",
      systemInstruction: "You are AuraMind's strict adaptive planner. Only use evidence present in the supplied plan, report and logs. Return valid JSON."
    });

    if (!validateSchedule(result.schedule, 7)) {
      throw new Error("Gemini returned an invalid 7-day adaptive schedule.");
    }

    return NextResponse.json({
      ...result,
      engine: "gemini"
    });
  } catch (error: any) {
    console.error("AuraMind adaptive AI error; using Core fallback:", error);
    const context = body?.plan?.goalContext ?? body?.goalContext ?? {};
    const fallback = makeDemoPlan({
      goal: String(body?.plan?.goal_summary ?? ""),
      deadline: String(context?.deadline ?? ""),
      currentLevel: String(context?.currentLevel ?? ""),
      targetLevel: String(context?.targetLevel ?? ""),
      fixedSchedule: String(context?.fixedSchedule ?? ""),
      dailyHours: Number(context?.dailyHours ?? 3),
      timezone: String(context?.timezone ?? "Asia/Kolkata")
    });
    return NextResponse.json({
      adaptationSummary: "Core adaptation generated a fresh week from the saved goal constraints.",
      changes: [
        "Reduce or move work in periods with repeated low focus.",
        "Protect the strongest recurring time window for harder work.",
        "Keep tasks concrete and measurable instead of automatically adding hours."
      ],
      weekly_focus: fallback.weekly_focus,
      success_definition: fallback.success_definition,
      schedule: fallback.schedule,
      engine: "core",
      degraded: true
    });
  }
}
