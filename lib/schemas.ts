import { z } from "zod";

export const Ctx = z.object({
  goal: z.string().trim().min(3, "Goal must be at least 3 characters").max(300),
  category: z.string().default("other"),
  deadline: z.string().max(30).optional().default(""),
  current_level: z.string().trim().min(1, "Current level is required").max(200),
  target_level: z.string().trim().min(1, "Target level is required").max(200),
  custom_current_level: z.string().max(200).optional(),
  custom_target_level: z.string().max(200).optional(),
  language: z.string().max(100).optional(),
  current_score: z.string().max(100).optional(),
  target_score: z.string().max(100).optional(),
  fixed: z.string().max(1000).default(""),
  hours: z.number().min(0.5, "Daily hours must be at least 0.5").max(16, "Daily hours cannot exceed 16"),
  focus: z.enum(["morning", "afternoon", "evening", "night"]).default("morning"),
  distractions: z.string().max(1000).default(""),
  previous: z.string().max(1000).default(""),
  constraints: z.string().max(1000).default(""),
  timezone: z.string().max(100).default("UTC"),
});

export type Ctx = z.infer<typeof Ctx>;

const TimeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format");

export const Block = z.object({
  start: TimeString,
  end: TimeString,
  activity: z.string().min(2).max(500),
  category: z.enum(["learn", "practice", "review", "repair", "checkpoint", "rest", "build", "diagnose"]),
  priority: z.enum(["high", "medium", "low"]),
  reason: z.string().min(2).max(600),
  duration_minutes: z.number().int().positive().optional(),
  instructions: z.string().max(1000).optional(),
  expected_output: z.string().max(600).optional(),
  completion_criterion: z.string().max(600).optional(),
  why_it_matters: z.string().max(600).optional(),
  resources_needed: z.string().max(400).optional(),
  fallback_action: z.string().max(500).optional(),
});

export type Block = z.infer<typeof Block>;

export const Day = z.object({
  day: z.number().int().min(1).max(30),
  day_label: z.string().default(""),
  calendar_date: z.string().default(""),
  phase: z.string(),
  daily_objective: z.string().max(500).optional(),
  blocks: z.array(Block).min(1).max(8),
});

export type Day = z.infer<typeof Day>;

export const WeeklyFocus = z.object({
  week: z.number(),
  title: z.string(),
  focus: z.string(),
  expected_outcome: z.string(),
});

export const Milestone = z.object({
  day: z.number(),
  milestone: z.string(),
  deliverable: z.string().optional(),
  validation_criteria: z.string().optional(),
});

export const GoalBlueprintSchema = z.object({
  intended_outcome: z.string().min(10),
  definition_of_success: z.string().min(10),
  starting_point_analysis: z.string().min(10),
  target_state_analysis: z.string().min(10),
  prerequisites: z.array(z.string()).default([]),
  core_workstreams: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      weight_percentage: z.number().min(5).max(80),
    })
  ).default([]),
  activity_dependencies: z.array(z.string()).default([]),
  milestones: z.array(
    z.object({
      day: z.number().min(1).max(30),
      title: z.string(),
      deliverable: z.string(),
      validation_test: z.string(),
    })
  ).default([]),
  bottlenecks_and_friction: z.array(z.string()).default([]),
  practice_methodology: z.string().min(15),
  daily_time_allocation: z.string().min(10),
  feasibility_notes: z.string().min(10),
  adaptation_triggers: z.array(z.string()).default([]),
  phases: z.array(
    z.object({
      phase_number: z.number(),
      name: z.string(),
      start_day: z.number(),
      end_day: z.number(),
      main_objective: z.string(),
      key_deliverable: z.string(),
    })
  ).default([]),
});

export type GoalBlueprint = z.infer<typeof GoalBlueprintSchema>;

export const QualityReviewSchema = z.object({
  passed: z.boolean(),
  relevance_score: z.number().min(1).max(10),
  specificity_score: z.number().min(1).max(10),
  progression_score: z.number().min(1).max(10),
  is_generic_template: z.boolean(),
  is_time_realistic: z.boolean(),
  strengths: z.array(z.string()).default([]),
  critical_issues: z.array(z.string()).default([]),
  repair_suggestions: z.array(z.string()).default([]),
});

export type QualityReview = z.infer<typeof QualityReviewSchema>;

export const Plan = z.object({
  goal_summary: z.string().default(""),
  definition_of_success: z.string().default(""),
  strategy_overview: z.string().optional(),
  weekly_focus: z.array(WeeklyFocus).default([]),
  risk_notes: z.array(z.string()).default([]),
  milestones: z.array(Milestone).default([]),
  relevant_research_findings: z.array(z.string()).default([]),
  days: z.array(Day).length(30),
  quality_score: z.number().optional(),
  generated_at: z.string().optional(),
  plan_source: z.enum(["ai", "demo", "fallback"]).default("ai"),
});

export type Plan = z.infer<typeof Plan>;

export const ResearchSchema = z.object({
  summary: z.string().min(20),
  requirements: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
  common_bottlenecks: z.array(z.string()).default([]),
  strategy: z.string().min(20),
  sources: z.array(z.string()).default([]),
});

export type ResearchSchema = z.infer<typeof ResearchSchema>;

export const Reasons = [
  "too_difficult",
  "did_not_understand",
  "tired",
  "phone",
  "social_media",
  "youtube",
  "gaming",
  "messaging",
  "unexpected_work",
  "family",
  "boredom",
  "environment",
  "other",
] as const;

export const Checkin = z.object({
  id: z.string(),
  day: z.number().int().min(1).max(30),
  planned: z.string().trim().min(1).max(500),
  actual: z.string().trim().max(500).default(""),
  status: z.enum(["done", "partial", "missed", "different"]),
  focused_min: z.number().int().min(0).max(1440),
  distraction_min: z.number().int().min(0).max(1440),
  distraction_type: z.string().nullable().optional(),
  reason: z.string().nullable().optional(),
  period: z.enum(["morning", "afternoon", "evening", "night"]),
  notes: z.string().max(1000).optional(),
});

export type Checkin = z.infer<typeof Checkin>;

export const TimerSessionInput = z.object({
  request_id: z.string(),
  task_activity: z.string().min(1).max(300),
  duration_min: z.number().int().min(1).max(300),
  actual_duration_min: z.number().int().min(0).max(300),
  status: z.enum(["completed", "abandoned", "in_progress"]),
  started_at: z.string(),
  completed_at: z.string().optional(),
});

export type TimerSessionInput = z.infer<typeof TimerSessionInput>;

export const ChatInput = z.object({
  request_id: z.string().optional(),
  conversation_id: z.string().optional(),
  message: z.string().trim().min(1).max(4000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "model", "system"]),
        content: z.string(),
      })
    )
    .optional(),
  enable_search: z.boolean().optional(),
});

export type ChatInput = z.infer<typeof ChatInput>;
