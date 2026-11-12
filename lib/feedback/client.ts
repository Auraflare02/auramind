import { getAdminClient } from "@/lib/supabase/admin";
import {
  FeedbackSubmission,
  CreateFeedbackInput,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackCategory,
} from "./types";

// In-memory store for offline development, local tests, and graceful fallback
export const inMemoryFeedback = new Map<string, FeedbackSubmission>();

/**
 * Automatically determine feedback priority based on category and keywords.
 */
function inferPriority(category: FeedbackCategory, text: string): FeedbackPriority {
  const lower = text.toLowerCase();
  if (
    lower.includes("security") ||
    lower.includes("cannot login") ||
    lower.includes("data loss") ||
    lower.includes("crash") ||
    lower.includes("payment failed")
  ) {
    return "critical";
  }
  if (
    category === "bug" ||
    lower.includes("broken") ||
    lower.includes("error") ||
    lower.includes("stuck") ||
    lower.includes("failed")
  ) {
    return "high";
  }
  if (category === "timetable" || category === "ai_quality") {
    return "medium";
  }
  return "low";
}

/**
 * Submits feedback from a beta user.
 */
export async function submitFeedback(
  input: CreateFeedbackInput
): Promise<{ ok: boolean; feedback: FeedbackSubmission; message: string }> {
  const admin = getAdminClient();
  const cleanDescription = (input.description || "").trim();

  if (!cleanDescription || cleanDescription.length < 5) {
    throw new Error("Please provide a detailed feedback description (minimum 5 characters).");
  }

  const priority: FeedbackPriority =
    input.priority || inferPriority(input.category, cleanDescription);
  const nowIso = new Date().toISOString();
  const generatedId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const newSubmission: FeedbackSubmission = {
    id: generatedId,
    userId: input.userId,
    userEmail: input.userEmail,
    userName: input.userName || input.userEmail.split("@")[0],
    category: input.category,
    feature: input.feature?.trim() || undefined,
    description: cleanDescription,
    satisfactionRating: input.satisfactionRating,
    priority,
    status: "open",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  inMemoryFeedback.set(generatedId, newSubmission);

  try {
    const { data, error } = await admin
      .from("feedback_submissions")
      .insert({
        id: generatedId,
        user_id: input.userId || null,
        user_email: input.userEmail,
        user_name: newSubmission.userName,
        category: input.category,
        feature: newSubmission.feature || null,
        description: cleanDescription,
        satisfaction_rating: input.satisfactionRating || null,
        priority,
        status: "open",
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      console.warn("[feedback] Database insert warning (using memory store):", error.message);
    } else if (data) {
      const persisted: FeedbackSubmission = {
        id: data.id,
        userId: data.user_id,
        userEmail: data.user_email,
        userName: data.user_name,
        category: data.category,
        feature: data.feature,
        description: data.description,
        satisfactionRating: data.satisfaction_rating,
        priority: data.priority,
        status: data.status,
        adminNotes: data.admin_notes,
        resolvedAt: data.resolved_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      inMemoryFeedback.set(persisted.id, persisted);
      return {
        ok: true,
        feedback: persisted,
        message: "Thank you for your beta feedback! Our engineering team will review it shortly.",
      };
    }
  } catch (err) {
    console.warn("[feedback] Database exception (using memory store):", err);
  }

  return {
    ok: true,
    feedback: newSubmission,
    message: "Thank you for your beta feedback! Our engineering team will review it shortly.",
  };
}

/**
 * Retrieves feedback submitted by a specific user.
 */
export async function getUserFeedback(userId: string): Promise<FeedbackSubmission[]> {
  const admin = getAdminClient();
  const results: FeedbackSubmission[] = [];

  try {
    const { data } = await admin
      .from("feedback_submissions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      for (const row of data) {
        results.push({
          id: row.id,
          userId: row.user_id,
          userEmail: row.user_email,
          userName: row.user_name,
          category: row.category,
          feature: row.feature,
          description: row.description,
          satisfactionRating: row.satisfaction_rating,
          priority: row.priority,
          status: row.status,
          adminNotes: row.admin_notes,
          resolvedAt: row.resolved_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    }
  } catch (err) {
    console.warn("[feedback] Error fetching user feedback:", err);
  }

  // Merge in-memory
  for (const item of Array.from(inMemoryFeedback.values())) {
    if (item.userId === userId && !results.some((r) => r.id === item.id)) {
      results.push(item);
    }
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results;
}

/**
 * Retrieves all feedback submissions for Admin triage.
 */
export async function getAllFeedback(filters?: {
  priority?: string;
  status?: string;
  category?: string;
}): Promise<FeedbackSubmission[]> {
  const admin = getAdminClient();
  const results: FeedbackSubmission[] = [];

  try {
    let query = admin
      .from("feedback_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filters?.priority && filters.priority !== "all") {
      query = query.eq("priority", filters.priority);
    }
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      for (const row of data) {
        results.push({
          id: row.id,
          userId: row.user_id,
          userEmail: row.user_email,
          userName: row.user_name,
          category: row.category,
          feature: row.feature,
          description: row.description,
          satisfactionRating: row.satisfaction_rating,
          priority: row.priority,
          status: row.status,
          adminNotes: row.admin_notes,
          resolvedAt: row.resolved_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    }
  } catch (err) {
    console.warn("[feedback] Error fetching all feedback:", err);
  }

  // Merge in-memory items
  for (const item of Array.from(inMemoryFeedback.values())) {
    const matchPriority = !filters?.priority || filters.priority === "all" || item.priority === filters.priority;
    const matchStatus = !filters?.status || filters.status === "all" || item.status === filters.status;
    const matchCategory = !filters?.category || filters.category === "all" || item.category === filters.category;

    if (matchPriority && matchStatus && matchCategory) {
      if (!results.some((r) => r.id === item.id)) {
        results.push(item);
      }
    }
  }

  // Priority weighting: critical > high > medium > low
  const priorityWeights: Record<FeedbackPriority, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  results.sort((a, b) => {
    const pwDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    if (pwDiff !== 0) return pwDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return results;
}

/**
 * Updates feedback triage status and notes (Admin action).
 */
export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  adminNotes?: string
): Promise<{ ok: boolean; feedback: FeedbackSubmission }> {
  const admin = getAdminClient();
  const nowIso = new Date().toISOString();

  let item = inMemoryFeedback.get(id);

  if (!item) {
    try {
      const { data } = await admin
        .from("feedback_submissions")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        item = {
          id: data.id,
          userId: data.user_id,
          userEmail: data.user_email,
          userName: data.user_name,
          category: data.category,
          feature: data.feature,
          description: data.description,
          satisfactionRating: data.satisfaction_rating,
          priority: data.priority,
          status: data.status,
          adminNotes: data.admin_notes,
          resolvedAt: data.resolved_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("[feedback] Error fetching feedback item for update:", err);
    }
  }

  if (!item) {
    throw new Error(`Feedback submission ${id} not found.`);
  }

  item.status = status;
  if (adminNotes !== undefined) {
    item.adminNotes = adminNotes;
  }
  if (status === "resolved" || status === "closed") {
    item.resolvedAt = nowIso;
  }
  item.updatedAt = nowIso;

  inMemoryFeedback.set(id, item);

  try {
    await admin
      .from("feedback_submissions")
      .update({
        status,
        admin_notes: item.adminNotes,
        resolved_at: item.resolvedAt || null,
        updated_at: nowIso,
      })
      .eq("id", id);
  } catch (err) {
    console.warn("[feedback] Database update error:", err);
  }

  return { ok: true, feedback: item };
}
