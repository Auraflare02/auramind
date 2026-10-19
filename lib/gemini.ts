import { z } from "zod";
import { Ctx, Plan, Day, Block, ResearchSchema } from "./schemas";
import { formatLevel } from "./categories";
import { fallbackPlan, phaseOf } from "./fallback";
import { AdaptivePlanProposal, ResearchData } from "./types";

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

export async function genJson<T>(prompt: string, schema: z.ZodType<T>, systemInstruction?: string): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();
  if (!key) throw new Error("ENV_GEMINI: GEMINI_API_KEY is not configured.");

  let lastError: unknown;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 45000);

    try {
      const payload: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        signal: ac.signal,
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini HTTP error ${res.status}: ${errorText.slice(0, 300)}`);
      }

      const json = await res.json();
      const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        const reason = json?.promptFeedback?.blockReason || json?.candidates?.[0]?.finishReason || "No content generated";
        throw new Error(`Gemini empty output: ${reason}`);
      }

      // Strip potential backticks
      const cleanJson = rawText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleanJson);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err;
      console.warn(`[gemini] JSON attempt ${attempt}/${maxAttempts} failed:`, String(err).slice(0, 300));
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

export async function genText(prompt: string, systemInstruction?: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  const model = getGeminiModel();
  if (!key) throw new Error("ENV_GEMINI: GEMINI_API_KEY is not configured.");

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 35000);

  try {
    const payload: any = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini HTTP error ${res.status}: ${errorText.slice(0, 300)}`);
    }

    const json = await res.json();
    const rawText: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini returned empty text response.");
    }

    return rawText.trim();
  } finally {
    clearTimeout(timeout);
  }
}

const buildSystemPrompt = (c: Ctx) => {
  const curLevel = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevel = formatLevel(c.category, c.target_level, c.custom_target_level);

  return `You are AuraMind's expert learning-science architect and accountability coach.
Core philosophy: "Don't plan a perfect day. Build a system that learns your real one."
User Context:
- Goal: "${c.goal}" (Category: ${c.category})
- Starting Level: ${curLevel}
- Target Level: ${tgtLevel}
${c.language ? `- Language: ${c.language}` : ""}
${c.current_score ? `- Current Score: ${c.current_score}, Target Score: ${c.target_score}` : ""}
- Available Hours: ${c.hours}h / day
- Best Focus Window: ${c.focus}
- Fixed Commitments: ${c.fixed || "None specified"}
- Known Distractions: ${c.distractions || "None specified"}
- Previous Difficulties: ${c.previous || "None specified"}
- Other Constraints: ${c.constraints || "None specified"}

Rules:
1. Ground all plans and advice in real cognitive science and deliberate practice.
2. Never shame the user for missed work; treat missed tasks as behavioral signals to diagnose workload, difficulty, or environmental friction.
3. Be realistic. Never promise guaranteed success by a deadline without disciplined execution.
4. Schedule hardest cognitive work inside the user's preferred focus window.
5. Respect sleep, recovery, transitions, and fixed commitments. Include a lighter day every 7 days.`;
};

export async function researchGoal(c: Ctx, externalEvidence = ""): Promise<ResearchData> {
  const sys = buildSystemPrompt(c);
  const prompt = `Conduct a rigorous learning-science breakdown for this goal.
${externalEvidence ? `External research evidence:\n${externalEvidence}\n` : ""}
Provide a comprehensive research strategy in JSON format conforming to this exact schema:
{
  "summary": string (concise 2-3 paragraph breakdown of requirements, realistic trajectory, and skill acquisition dynamics),
  "requirements": string[] (list of 4-6 essential competencies needed to reach the target level),
  "prerequisites": string[] (list of 3-5 foundational skills or knowledge required before advanced practice),
  "common_bottlenecks": string[] (list of 4-5 major friction points or failure modes learners encounter),
  "strategy": string (clear pedagogical roadmap explaining how deliberate practice and feedback loops will overcome bottlenecks),
  "sources": string[] (scientific or pedagogical principles applied, e.g. "Spaced Retrieval Practice (Roediger & Butler)", "CEFR Framework Standards")
}`;
  const res = await genJson(prompt, ResearchSchema, sys);
  return {
    summary: res.summary,
    strategy: res.strategy,
    requirements: res.requirements || [],
    prerequisites: res.prerequisites || [],
    common_bottlenecks: res.common_bottlenecks || [],
    sources: res.sources || [],
  };
}

export async function generatePlan(c: Ctx, researchSummary: string, startDate?: Date): Promise<Plan> {
  const baseDate = startDate ? new Date(startDate) : new Date(Date.now() + 864e5);
  const sys = buildSystemPrompt(c);

  // Generate the plan in 3 cohesive 10-day phases to ensure ultra-high quality and avoid token truncation
  const ranges: [number, number, string][] = [
    [1, 10, "Days 1-7 Foundation & Days 8-10 Deliberate Practice Kickoff"],
    [11, 20, "Days 11-15 Deliberate Practice Mastery & Days 16-20 Application Phase"],
    [21, 30, "Days 21-22 Application Culmination, Days 23-27 Error Diagnostics & Repair, Days 28-30 Final Consolidation"],
  ];

  const partPromises = ranges.map(async ([startDay, endDay, phaseDesc]) => {
    const daysCount = endDay - startDay + 1;
    const prompt = `Research Context:
${researchSummary}

Task: Create days ${startDay} through ${endDay} (${phaseDesc}) of the 30-day timetable.
Rules:
- Total focused study per day <= ${c.hours} hours.
- Put the hardest task during the user's ${c.focus} focus window.
- Respect fixed commitments: ${c.fixed || "none"}.
- Day 7 and Day 14 and Day 21 and Day 28 must be lighter days (50% study volume) to avoid cognitive fatigue.
- Each task block must have:
  - "start" and "end" in HH:MM 24-hour format.
  - "activity": concrete action with measurable output.
  - "category": one of ["learn", "practice", "review", "repair", "checkpoint", "rest"].
  - "priority": one of ["high", "medium", "low"].
  - "reason": pedagogical justification explaining why this task is scheduled now.
- Return JSON conforming to:
{
  "days": [
    {
      "day": number,
      "phase": string,
      "blocks": [
        {
          "start": string,
          "end": string,
          "activity": string,
          "category": string,
          "priority": string,
          "reason": string
        }
      ]
    }
  ]
}
Return exactly ${daysCount} days starting at day ${startDay} and ending at day ${endDay}.`;

    const subSchema = z.object({
      days: z.array(
        z.object({
          day: z.number(),
          phase: z.string().default("Deliberate Practice"),
          blocks: z.array(Block).min(1).max(8),
        })
      ).length(daysCount),
    });

    const res = await genJson(prompt, subSchema, sys);
    return res.days;
  });

  const [part1, part2, part3] = await Promise.all(partPromises);
  const combinedRawDays = [...part1, ...part2, ...part3];

  const days: Day[] = combinedRawDays.map((d, index) => {
    const dayNum = index + 1;
    const dayDate = new Date(baseDate.getTime() + (dayNum - 1) * 864e5);
    const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
    const calDate = dayDate.toISOString().split("T")[0];

    return {
      day: dayNum,
      day_label: `Day ${dayNum} (${dayName})`,
      calendar_date: calDate,
      phase: phaseOf(dayNum),
      blocks: d.blocks,
    };
  });

  const curLevel = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevel = formatLevel(c.category, c.target_level, c.custom_target_level);

  // Generate metadata / weekly focus overview
  const metaPrompt = `Create the executive plan metadata for this 30-day goal: "${c.goal}" (${curLevel} to ${tgtLevel}).
Research Findings: ${researchSummary}

Return JSON with:
{
  "goal_summary": string,
  "definition_of_success": string,
  "weekly_focus": [
    { "week": 1, "title": string, "focus": string, "expected_outcome": string },
    { "week": 2, "title": string, "focus": string, "expected_outcome": string },
    { "week": 3, "title": string, "focus": string, "expected_outcome": string },
    { "week": 4, "title": string, "focus": string, "expected_outcome": string }
  ],
  "risk_notes": string[] (3-4 risks),
  "milestones": [
    { "day": 7, "milestone": string },
    { "day": 14, "milestone": string },
    { "day": 21, "milestone": string },
    { "day": 30, "milestone": string }
  ],
  "relevant_research_findings": string[] (3 findings)
}`;

  const metaSchema = z.object({
    goal_summary: z.string(),
    definition_of_success: z.string(),
    weekly_focus: z.array(
      z.object({
        week: z.number(),
        title: z.string(),
        focus: z.string(),
        expected_outcome: z.string(),
      })
    ).length(4),
    risk_notes: z.array(z.string()).min(2),
    milestones: z.array(
      z.object({
        day: z.number(),
        milestone: z.string(),
      })
    ).min(3),
    relevant_research_findings: z.array(z.string()).min(2),
  });

  let meta;
  try {
    meta = await genJson(metaPrompt, metaSchema, sys);
  } catch (err) {
    console.warn("[gemini] Meta generation failed, using structured defaults:", err);
    const fb = fallbackPlan(c, baseDate);
    meta = {
      goal_summary: fb.goal_summary,
      definition_of_success: fb.definition_of_success,
      weekly_focus: fb.weekly_focus,
      risk_notes: fb.risk_notes,
      milestones: fb.milestones,
      relevant_research_findings: fb.relevant_research_findings,
    };
  }

  return Plan.parse({
    ...meta,
    days,
  });
}

export async function chatWithAuraMind(
  c: Ctx,
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[],
  userMessage: string,
  extraContext?: {
    currentDay?: number;
    todayTasks?: string[];
    recentCheckins?: any[];
    focusSessionStats?: any;
  }
): Promise<string> {
  const sys = `${buildSystemPrompt(c)}

ROLE & BEHAVIOR:
You are the user's primary AI accountability partner and cognitive strategist inside AuraMind.
You have access to their live goal schedule, check-in records, and focus metrics.
When they ask questions, provide direct, thoughtful, evidence-based answers.
- If they missed tasks: Analyze why (difficulty, fatigue, distractions), offer empathetic reassurance, and recommend an immediate bite-sized recovery action. Never shame.
- If they ask concept questions: Explain clearly with analogies, examples, and active retrieval checks.
- If they ask for timetable adjustments: Recommend specific practical shifts based on their focus window and recorded bottlenecks.
- Distinguish between recorded facts, reasonable interpretations, and recommendations.`;

  const contextAddendum = extraContext ? `
Live Dashboard Context:
- Current Day in 30-Day Plan: Day ${extraContext.currentDay || 1}
- Today's Planned Tasks: ${JSON.stringify(extraContext.todayTasks || [])}
- Recent Check-ins: ${JSON.stringify(extraContext.recentCheckins || [])}
- Focus Timer Stats Today: ${JSON.stringify(extraContext.focusSessionStats || {})}
` : "";

  const messagesFormatted = conversationHistory
    .slice(-8)
    .map((m) => `${m.role === "user" ? "User" : "AuraMind"}: ${m.content}`)
    .join("\n\n");

  const prompt = `${contextAddendum}

Recent Conversation:
${messagesFormatted}

User: ${userMessage}
AuraMind:`;

  return genText(prompt, sys);
}

export async function generateCheckinCoaching(
  c: Ctx,
  checkin: {
    planned: string;
    actual: string;
    status: string;
    focused_min: number;
    distraction_min: number;
    distraction_type?: string | null;
    reason?: string | null;
    notes?: string;
  }
): Promise<string> {
  if (!isGeminiConfigured()) {
    return checkin.status === "done"
      ? "Session recorded. Notice what conditions helped this block succeed so you can replicate them tomorrow."
      : `Recorded as a signal, not a failure. Adjust the next block: reduce scope or take a 5-minute reset before diving in.`;
  }

  const sys = buildSystemPrompt(c);
  const prompt = `The user just completed an hourly accountability check-in:
- Planned Activity: "${checkin.planned}"
- Actual Activity: "${checkin.actual || "None stated"}"
- Status: ${checkin.status}
- Focused Time: ${checkin.focused_min} minutes
- Distraction Time: ${checkin.distraction_min} minutes
- Distraction Category: ${checkin.distraction_type || "None"}
- Primary Bottleneck Reason: ${checkin.reason || "None specified"}
- User Notes: "${checkin.notes || "None"}"

Respond with concise (max 3 sentences), highly empathetic, and practical coaching.
If they succeeded, celebrate specific execution.
If they were partial or missed, treat it as diagnostic data: identify the friction point and give ONE concrete action for their immediate next step.`;

  try {
    return await genText(prompt, sys);
  } catch {
    return "Check-in saved. Keep moving forward one block at a time.";
  }
}

export async function generateDailyNarrative(
  c: Ctx,
  day: number,
  metrics: {
    completion_pct: number;
    focused_min: number;
    distraction_min: number;
    strongest_period: string;
    weakest_period: string;
    primary_blocker: string;
  },
  checkins: any[]
): Promise<{ coaching_summary: string; tomorrow_recommendation: string; practical_next_action: string }> {
  const schema = z.object({
    coaching_summary: z.string(),
    tomorrow_recommendation: z.string(),
    practical_next_action: z.string(),
  });

  if (!isGeminiConfigured() || !checkins.length) {
    return {
      coaching_summary: `Completed ${metrics.completion_pct}% of planned blocks with ${metrics.focused_min} min of deep focus.`,
      tomorrow_recommendation: metrics.primary_blocker !== "Not enough data yet."
        ? `Guard against ${metrics.primary_blocker.replace(/_/g, " ")} by preparing your workspace 10 minutes prior.`
        : "Maintain your rhythm by tackling the hardest priority first.",
      practical_next_action: "Review today's notes and lay out tomorrow's learning materials before ending your evening.",
    };
  }

  const sys = buildSystemPrompt(c);
  const prompt = `Analyze today's Day ${day} performance data:
Verified Calculated Metrics:
- Completion: ${metrics.completion_pct}%
- Focused: ${metrics.focused_min} min
- Distracted: ${metrics.distraction_min} min
- Strongest Period: ${metrics.strongest_period}
- Weakest Period: ${metrics.weakest_period}
- Main Blocker: ${metrics.primary_blocker}
Logged Check-ins:
${JSON.stringify(checkins.slice(0, 8))}

Do not overwrite or invent new numbers. Provide empathetic learning-science narrative in JSON:
{
  "coaching_summary": string (2-3 sentences evaluating the day's focus vs resistance),
  "tomorrow_recommendation": string (how to structure tomorrow to mitigate today's friction),
  "practical_next_action": string (one 5-minute immediate action to wrap up today)
}`;

  return genJson(prompt, schema, sys);
}

export async function generateWeeklyNarrative(
  c: Ctx,
  metrics: any,
  checkins: any[]
): Promise<{ major_difficulties: string[]; recommendations: string[]; adaptation_advisory: string }> {
  const schema = z.object({
    major_difficulties: z.array(z.string()).min(1),
    recommendations: z.array(z.string()).min(1),
    adaptation_advisory: z.string(),
  });

  if (!isGeminiConfigured() || checkins.length < 5) {
    return {
      major_difficulties: ["Insufficient historical check-ins to confirm recurring bottlenecks."],
      recommendations: ["Log check-ins consistently across the next 7 days to surface deep behavioral trends."],
      adaptation_advisory: "Proceed with standard timetable progression until sufficient behavioral data is recorded.",
    };
  }

  const sys = buildSystemPrompt(c);
  const prompt = `Analyze 7-day performance data:
Metrics: ${JSON.stringify(metrics)}
Check-ins: ${JSON.stringify(checkins.slice(0, 15))}

Provide objective pattern analysis in JSON:
{
  "major_difficulties": string[] (2-4 recurrent friction points backed by logged evidence),
  "recommendations": string[] (2-4 actionable adjustments for next week),
  "adaptation_advisory": string (advice on whether the upcoming schedule should reduce difficulty, increase foundation drills, or continue as planned)
}`;

  return genJson(prompt, schema, sys);
}

export async function generateAdaptiveSchedule(
  c: Ctx,
  startDay: number,
  checkins: any[],
  currentPlanDays: Day[]
): Promise<AdaptivePlanProposal> {
  const schema = z.object({
    rationale: z.string(),
    key_adjustments: z.array(z.string()).min(2),
    adjusted_days: z.array(
      z.object({
        day: z.number(),
        day_label: z.string(),
        calendar_date: z.string(),
        phase: z.string(),
        blocks: z.array(Block).min(1).max(8),
      })
    ).length(7),
  });

  const targetDays = currentPlanDays.filter((d) => d.day >= startDay && d.day < startDay + 7);
  if (targetDays.length !== 7 || !isGeminiConfigured()) {
    // Return fallback adaptation
    return {
      rationale: "Automated adaptation: reinforced review blocks and adjusted spacing around user's designated focus window.",
      key_adjustments: [
        "Added 15-minute diagnostic review buffer to early sessions",
        "Reinforced lighter pace on day 7 to protect recovery",
      ],
      adjusted_days: targetDays.length === 7 ? targetDays : currentPlanDays.slice(0, 7),
    };
  }

  const sys = buildSystemPrompt(c);
  const prompt = `Task: Rebuild the upcoming 7 days (Days ${startDay} to ${startDay + 6}) based on real logged behavior.
Recent Check-in Logs:
${JSON.stringify(checkins.slice(-15))}

Original Upcoming 7 Days:
${JSON.stringify(targetDays)}

Rules:
1. If tasks were repeatedly missed due to 'too_difficult', split into smaller sub-skills and add prerequisite drills.
2. If missed due to 'tired', shift hardest work to their peak ${c.focus} window.
3. If phone/distractions were frequent, shorten continuous blocks to 30-40 min with distinct rest intervals.
4. Do NOT increase volume as punishment. Protect sleep and 1 lighter day.
5. Return JSON:
{
  "rationale": string (explanation of evidence-based changes),
  "key_adjustments": string[] (list of 3 key modifications),
  "adjusted_days": array of 7 Day objects with sequential days ${startDay} through ${startDay + 6}.
}`;

  return genJson(prompt, schema, sys);
}
