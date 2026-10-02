export type Priority = "high" | "medium" | "low";

export type ScheduleBlock = {
  start: string;
  end: string;
  activity: string;
  category: string;
  priority: Priority;
  reason: string;
};

export type PlanDay = {
  day: string;
  date: string;
  blocks: ScheduleBlock[];
};

export type ResearchBrief = {
  research_summary: string;
  requirements: string[];
  prerequisites: string[];
  common_bottlenecks: string[];
  strategy: string[];
};

export type ResearchSource = {
  title: string;
  url: string;
};

export type AuraPlan = {
  engine?: "ai" | "core" | "openai" | "demo";
  research?: ResearchBrief;
  researchSources?: ResearchSource[];
  milestones?: { title: string; outcome: string; timing: string }[];
  goal_summary: string;
  success_definition: string;
  weekly_focus: string;
  risk_notes: string[];
  schedule: PlanDay[];
};

export type HourLog = {
  id: string;
  date: string;
  hourStart: string;
  hourEnd: string;
  plannedActivity: string;
  actualActivity: string;
  outcome: "completed" | "partial" | "skipped" | "different";
  focusedMinutes: number;
  distractionMinutes: number;
  distractionCategory: string;
  distractionReason: string;
  notes: string;
};

export type DailyReport = {
  date: string;
  completionPercent: number;
  plannedMinutes: number;
  focusedMinutes: number;
  distractionMinutes: number;
  strongestPeriod: string;
  weakestPeriod: string;
  keyProblem: string;
  solution: string;
  aiSummary?: string;
};

export type WeeklyReport = {
  weekStart: string;
  weekEnd: string;
  completionPercent: number;
  focusedMinutes: number;
  distractionMinutes: number;
  bestPeriod: string;
  worstPeriod: string;
  topDistractions: string[];
  recurringReasons: string[];
  patterns: string[];
  recommendations: string[];
  aiSummary?: string;
};
