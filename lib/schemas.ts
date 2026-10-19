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
  activity: z.string().min(2).max(300),
  category: z.enum(["learn", "practice", "review", "repair", "checkpoint", "rest"]),
  priority: z.enum(["high", "medium", "low"]),
  reason: z.string().min(2).max(400),
});

export type Block = z.infer<typeof Block>;

export const Day = z.object({
  day: z.number().int().min(1).max(30),
  day_label: z.string().default(""),
  calendar_date: z.string().default(""),
  phase: z.string(),
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
});

export const Plan = z.object({
  goal_summary: z.string().default(""),
  definition_of_success: z.string().default(""),
  weekly_focus: z.array(WeeklyFocus).default([]),
  risk_notes: z.array(z.string()).default([]),
  milestones: z.array(Milestone).default([]),
  relevant_research_findings: z.array(z.string()).default([]),
  days: z.array(Day).length(30),
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
  request_id: z.string(),
  message: z.string().trim().min(1).max(2000),
});

export type ChatInput = z.infer<typeof ChatInput>;
