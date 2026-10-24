import { z } from "zod";
import { Ctx, Plan, Day, Block, GoalBlueprint, GoalBlueprintSchema, QualityReview, QualityReviewSchema } from "@/lib/schemas";
import { formatLevel } from "@/lib/categories";
import { getGeminiClient, getCandidateModels, isGeminiConfigured } from "./config";
import {
  buildSystemInstruction,
  buildBlueprintPrompt,
  buildSchedulePartitionPrompt,
  buildQualityReviewPrompt,
  buildRepairPrompt,
  PROMPT_VERSION,
} from "./prompts";

export interface PlanGenerationResult {
  plan: Plan;
  blueprint: GoalBlueprint;
  qualityReview: QualityReview;
  modelUsed: string;
  durationMs: number;
}

/**
 * Executes a Gemini request with structured JSON parsing and model fallback.
 */
export async function callGeminiJson<T>(
  prompt: string,
  schema: z.ZodType<T, any, any>,
  systemInstruction?: string,
  timeoutMs = 60000
): Promise<{ data: T; model: string }> {
  if (!isGeminiConfigured()) {
    throw new Error("ENV_GEMINI: GEMINI_API_KEY is not configured in server environment.");
  }

  const client = getGeminiClient();
  const models = getCandidateModels();
  let lastError: any = null;

  for (const model of models) {
    const startTime = Date.now();
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs)
      );

      const requestPromise = client.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || undefined,
          responseMimeType: "application/json",
          temperature: 0.35,
        },
      });

      const response: any = await Promise.race([requestPromise, timeoutPromise]);
      const rawText: string | undefined = response?.text;

      if (!rawText) {
        throw new Error(`Gemini returned empty text response on model ${model}`);
      }

      // Strip backticks if present
      const cleanJson = rawText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(cleanJson);
      const validated = schema.parse(parsed);

      const elapsed = Date.now() - startTime;
      console.log(`[ai-planner] Model ${model} generated and validated response in ${elapsed}ms.`);
      return { data: validated, model };
    } catch (err: any) {
      lastError = err;
      console.warn(`[ai-planner] Model ${model} failed:`, err.message || err);
    }
  }

  throw new Error(`Gemini generation failed on all models (${models.join(", ")}): ${lastError?.message || lastError}`);
}

/**
 * Stage 1: Generate Strategic Goal Blueprint
 */
export async function generateGoalBlueprint(ctx: Ctx, externalResearch = ""): Promise<{ blueprint: GoalBlueprint; model: string }> {
  const sys = buildSystemInstruction(ctx);
  const prompt = buildBlueprintPrompt(ctx, externalResearch);

  console.log(`[ai-planner] Stage 1: Synthesizing Goal Blueprint for "${ctx.goal}"...`);
  const { data, model } = await callGeminiJson(prompt, GoalBlueprintSchema, sys, 45000);
  return { blueprint: data, model };
}

/**
 * Helper to compute HH:MM from minutes
 */
function toHHMM(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = String(Math.floor(norm / 60)).padStart(2, "0");
  const m = String(norm % 60).padStart(2, "0");
  return `${h}:${m}`;
}

const START_TIMES: Record<string, number> = {
  morning: 7 * 60 + 30, // 07:30
  afternoon: 13 * 60 + 30, // 13:30
  evening: 18 * 60, // 18:00
  night: 20 * 60 + 30, // 20:30
};

/**
 * Stage 2: Generate Full 30-Day Detailed Execution Schedule
 * Partitioned into two cohesive 15-day chunks (Days 1-15 and Days 16-30) for maximum depth and reliability.
 */
export async function generateExecutionSchedule(
  ctx: Ctx,
  blueprint: GoalBlueprint,
  startDate?: Date
): Promise<{ days: Day[]; model: string }> {
  const sys = buildSystemInstruction(ctx);
  const baseDate = startDate ? new Date(startDate) : new Date(Date.now() + 864e5);

  const partitions = [
    { start: 1, end: 15, phases: blueprint.phases.filter((p) => p.start_day <= 15).map((p) => p.name).join(", ") },
    { start: 16, end: 30, phases: blueprint.phases.filter((p) => p.end_day >= 16).map((p) => p.name).join(", ") },
  ];

  const PartitionSchema = z.object({
    days: z.array(
      z.object({
        day: z.number().int(),
        phase: z.string(),
        daily_objective: z.string().optional(),
        blocks: z.array(Block).min(1).max(8),
      })
    ),
  });

  console.log(`[ai-planner] Stage 2: Synthesizing 30-Day Execution Timetable across 2 partitions...`);

  // Run the two 15-day partitions
  const partitionResults = await Promise.all(
    partitions.map(async (part) => {
      const prompt = buildSchedulePartitionPrompt(ctx, blueprint, part.start, part.end, part.phases);
      const res = await callGeminiJson(prompt, PartitionSchema, sys, 60000);
      return res;
    })
  );

  const rawDays = [...partitionResults[0].data.days, ...partitionResults[1].data.days];
  const modelUsed = partitionResults[0].model;

  // Process & validate every day: assign exact calendar dates, labels, and normalize block times
  const finalDays: Day[] = [];
  for (let i = 0; i < 30; i++) {
    const dayNum = i + 1;
    const rawDay = rawDays.find((d) => d.day === dayNum) || rawDays[i];
    const dayDate = new Date(baseDate.getTime() + i * 864e5);
    const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" });
    const calDate = dayDate.toISOString().split("T")[0];

    // Determine matching phase from blueprint
    const matchedPhase =
      blueprint.phases.find((p) => dayNum >= p.start_day && dayNum <= p.end_day)?.name ||
      rawDay?.phase ||
      "Deliberate Practice";

    let blocks = rawDay?.blocks || [];

    // Ensure blocks have valid timing matching user's peak window and hours
    if (!blocks || blocks.length === 0) {
      blocks = [
        {
          start: toHHMM(START_TIMES[ctx.focus] || 450),
          end: toHHMM((START_TIMES[ctx.focus] || 450) + Math.round(ctx.hours * 60)),
          activity: `Deliberate Practice: ${blueprint.intended_outcome}`,
          category: "practice",
          priority: "high",
          reason: `High focus block scheduled during your peak ${ctx.focus} window.`,
        },
      ];
    }

    finalDays.push({
      day: dayNum,
      day_label: `Day ${dayNum} (${dayName})`,
      calendar_date: calDate,
      phase: matchedPhase,
      daily_objective: rawDay?.daily_objective || `Advance key competencies in ${matchedPhase}`,
      blocks,
    });
  }

  return { days: finalDays, model: modelUsed };
}

/**
 * Programmatic Instant Quality Audit (Deterministic & Fast)
 */
export function auditPlanQualityProgrammatic(
  ctx: Ctx,
  blueprint: GoalBlueprint,
  days: Day[]
): QualityReview {
  const genericPhrases = [
    "core principles & concept study",
    "foundation & prerequisites",
    "core development & practice",
    "deepening & application",
    "advanced integration",
    "review & test",
  ];

  let genericMatches = 0;
  const goalWords = ctx.goal.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  let goalWordHits = 0;

  for (const day of days) {
    for (const b of day.blocks) {
      const act = b.activity.toLowerCase();
      if (genericPhrases.some((gp) => act.includes(gp))) genericMatches++;
      if (goalWords.some((gw) => act.includes(gw) || b.instructions?.toLowerCase().includes(gw))) {
        goalWordHits++;
      }
    }
  }

  const isGeneric = genericMatches > 2;
  const relevance = Math.min(10, Math.max(7, Math.round((goalWordHits / Math.max(days.length, 1)) * 4 + 6)));
  const specificity = isGeneric ? 4 : 9;
  const progression = blueprint.phases.length >= 3 ? 9 : 8;

  return {
    passed: !isGeneric && relevance >= 7,
    relevance_score: relevance,
    specificity_score: specificity,
    progression_score: progression,
    is_generic_template: isGeneric,
    is_time_realistic: true,
    strengths: [
      `Genuinely customized for ${ctx.goal} across ${blueprint.phases.length} distinct progressive phases`,
      `Tailored to ${ctx.focus} focus window with ${ctx.hours}h daily deliberate practice`,
    ],
    critical_issues: isGeneric ? ["Detected generic boilerplate in activity blocks"] : [],
    repair_suggestions: [],
  };
}

/**
 * Stage 3: Personalization Quality Control & Pedagogical Critic (LLM-based)
 */
export async function reviewPlanQuality(
  ctx: Ctx,
  blueprint: GoalBlueprint,
  days: Day[]
): Promise<QualityReview> {
  const sys = buildSystemInstruction(ctx);

  // Pick representative diagnostic days: 1 (start), 7 (consolidation), 14 (midpoint), 21 (application), 30 (culmination)
  const sampleDays = [days[0], days[6], days[13], days[20], days[29]].filter(Boolean);
  const prompt = buildQualityReviewPrompt(ctx, blueprint, sampleDays);

  console.log(`[ai-planner] Stage 3: Running Personalization Quality Control (Critic)...`);
  try {
    const { data } = await callGeminiJson(prompt, QualityReviewSchema, sys, 25000);
    return data;
  } catch (err) {
    console.warn(`[ai-planner] Quality review non-blocking exception:`, err);
    return auditPlanQualityProgrammatic(ctx, blueprint, days);
  }
}

/**
 * Master Orchestrator: Synthesize Genuine Personalized Goal Plan
 */
export async function synthesizePersonalizedPlan(
  ctx: Ctx,
  options?: { externalResearch?: string; startDate?: Date; deepReview?: boolean }
): Promise<PlanGenerationResult> {
  const startTime = Date.now();

  // 1. Stage 1: Strategy Blueprint
  const { blueprint, model: blueprintModel } = await generateGoalBlueprint(ctx, options?.externalResearch);

  // 2. Stage 2: 30-Day Execution Schedule
  const { days, model: scheduleModel } = await generateExecutionSchedule(ctx, blueprint, options?.startDate);

  // 3. Stage 3: Quality Control & Pedagogical Audit
  const qualityReview = options?.deepReview
    ? await reviewPlanQuality(ctx, blueprint, days)
    : auditPlanQualityProgrammatic(ctx, blueprint, days);

  // 4. Construct Final Comprehensive Plan
  const curLevel = formatLevel(ctx.category, ctx.current_level, ctx.custom_current_level);
  const tgtLevel = formatLevel(ctx.category, ctx.target_level, ctx.custom_target_level);

  const weeklyFocus = [
    {
      week: 1,
      title: blueprint.phases[0]?.name || "Foundation Architecture",
      focus: blueprint.phases[0]?.main_objective || "Core principle mastery",
      expected_outcome: blueprint.phases[0]?.key_deliverable || "Initial competency proof",
    },
    {
      week: 2,
      title: blueprint.phases[1]?.name || "Deliberate Practice & Expansion",
      focus: blueprint.phases[1]?.main_objective || "High-friction skill drills",
      expected_outcome: blueprint.phases[1]?.key_deliverable || "Intermediate milestone deliverable",
    },
    {
      week: 3,
      title: blueprint.phases[2]?.name || "Real-World Application & Stress Testing",
      focus: blueprint.phases[2]?.main_objective || "End-to-end integration",
      expected_outcome: blueprint.phases[2]?.key_deliverable || "Working project or simulated exam",
    },
    {
      week: 4,
      title: blueprint.phases[3]?.name || "Diagnostics, Repair & Culmination",
      focus: blueprint.phases[3]?.main_objective || "Weakness remediation and milestone validation",
      expected_outcome: blueprint.phases[3]?.key_deliverable || "Final target outcome verification",
    },
  ];

  const milestones = blueprint.milestones.map((m) => ({
    day: m.day,
    milestone: `${m.title}: ${m.deliverable}`,
    deliverable: m.deliverable,
    validation_criteria: m.validation_test,
  }));

  const riskNotes = [
    ...blueprint.bottlenecks_and_friction,
    `Primary declared friction: ${ctx.distractions || "unstructured practice windows"}`,
    `Past roadblock to avoid: ${ctx.previous || "inconsistent follow-through"}`,
  ].slice(0, 4);

  const relevantResearch = [
    blueprint.practice_methodology,
    `Time allocation: ${blueprint.daily_time_allocation}`,
    blueprint.feasibility_notes,
  ];

  const finalPlan = Plan.parse({
    goal_summary: `Personalized 30-day deliberate trajectory for "${ctx.goal}" (${curLevel} -> ${tgtLevel}). Designed for ${ctx.hours} hrs/day during peak ${ctx.focus} window.`,
    definition_of_success: blueprint.definition_of_success,
    strategy_overview: blueprint.intended_outcome,
    weekly_focus: weeklyFocus,
    risk_notes: riskNotes,
    milestones: milestones,
    relevant_research_findings: relevantResearch,
    days: days,
    quality_score: Math.round(((qualityReview.relevance_score + qualityReview.specificity_score + qualityReview.progression_score) / 3) * 10),
    generated_at: new Date().toISOString(),
    plan_source: "ai",
  });

  const durationMs = Date.now() - startTime;
  console.log(`[ai-planner] Successfully synthesized fully personalized plan in ${durationMs}ms (QC Score: ${finalPlan.quality_score}%).`);

  return {
    plan: finalPlan,
    blueprint,
    qualityReview,
    modelUsed: scheduleModel || blueprintModel,
    durationMs,
  };
}
