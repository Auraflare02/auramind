export type FeedbackCategory =
  | "bug"
  | "feature_request"
  | "ai_quality"
  | "timetable"
  | "ux"
  | "performance"
  | "other";

export type FeedbackPriority = "critical" | "high" | "medium" | "low";

export type FeedbackStatus = "open" | "in_review" | "resolved" | "closed";

export interface FeedbackSubmission {
  id: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  category: FeedbackCategory;
  feature?: string;
  description: string;
  satisfactionRating?: number; // 1-5
  priority: FeedbackPriority;
  status: FeedbackStatus;
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackInput {
  userId?: string;
  userEmail: string;
  userName?: string;
  category: FeedbackCategory;
  feature?: string;
  description: string;
  satisfactionRating?: number;
  priority?: FeedbackPriority;
}
