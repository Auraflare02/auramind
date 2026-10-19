export type RequestStatus = "pending" | "researching" | "review" | "ready" | "archived";

export type FocusWindow = "morning" | "afternoon" | "evening" | "night";

export type TaskCategory = "learn" | "practice" | "review" | "repair" | "checkpoint" | "rest";

export type TaskPriority = "high" | "medium" | "low";

export type CheckinStatus = "done" | "partial" | "missed" | "different";

export interface UserGoalContext {
  goal: string;
  category: string;
  deadline?: string;
  current_level: string;
  target_level: string;
  custom_current_level?: string;
  custom_target_level?: string;
  language?: string;
  current_score?: string;
  target_score?: string;
  hours: number;
  focus: FocusWindow;
  fixed: string;
  distractions: string;
  previous: string;
  constraints: string;
  timezone: string;
}

export interface PlanBlock {
  start: string;
  end: string;
  activity: string;
  category: TaskCategory;
  priority: TaskPriority;
  reason: string;
}

export interface PlanDay {
  day: number;
  day_label: string;
  calendar_date: string;
  phase: string;
  blocks: PlanBlock[];
}

export interface WeeklyFocusItem {
  week: number;
  title: string;
  focus: string;
  expected_outcome: string;
}

export interface MilestoneItem {
  day: number;
  milestone: string;
}

export interface Plan {
  goal_summary: string;
  definition_of_success: string;
  weekly_focus: WeeklyFocusItem[];
  risk_notes: string[];
  milestones: MilestoneItem[];
  relevant_research_findings: string[];
  days: PlanDay[];
}

export interface ResearchData {
  summary: string;
  requirements: string[];
  prerequisites: string[];
  common_bottlenecks: string[];
  strategy: string;
  sources?: string[];
}

export interface GoalRequestRecord {
  id: string;
  request_code: string;
  status: RequestStatus;
  category: string;
  current_level: string;
  target_level: string;
  timezone: string;
  context: UserGoalContext;
  research?: string;
  research_data?: ResearchData;
  plan?: Plan;
  plan_source?: "ai" | "fallback";
  ready_at?: string;
  started_at?: string;
  session_token?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckinRecord {
  id: string;
  request_id: string;
  day: number;
  planned: string;
  actual: string;
  status: CheckinStatus;
  focused_min: number;
  distraction_min: number;
  distraction_type: string | null;
  reason: string | null;
  period: FocusWindow;
  notes?: string;
  created_at?: string;
}

export interface FocusSessionRecord {
  id: string;
  request_id: string;
  task_activity: string;
  duration_min: number;
  actual_duration_min: number;
  status: "completed" | "abandoned" | "in_progress";
  xp_awarded: number;
  started_at: string;
  completed_at?: string;
  created_at?: string;
}

export interface ChatMessageRecord {
  id: string;
  request_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface DailyReportData {
  day: number;
  enough: boolean;
  completion_pct: number;
  planned_tasks: number;
  completed_tasks: number;
  focused_min: number;
  distraction_min: number;
  strongest_period: string;
  weakest_period: string;
  primary_blocker: string;
  coaching_summary: string;
  tomorrow_recommendation: string;
  practical_next_action: string;
}

export interface WeeklyReportData {
  enough: boolean;
  message?: string;
  total_checkins: number;
  weekly_consistency_pct: number;
  total_focused_hours: number;
  total_distraction_hours: number;
  strongest_period: string;
  weakest_period: string;
  repeated_distraction: string;
  recurring_reason: string;
  major_difficulties: string[];
  recommendations: string[];
  adaptation_advisory: string;
}

export interface AdaptivePlanProposal {
  rationale: string;
  key_adjustments: string[];
  adjusted_days: PlanDay[];
}

export interface UserStats {
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_focus_min: number;
  completed_sessions_count: number;
  completed_tasks_count: number;
  unlocked_achievements: string[];
}
