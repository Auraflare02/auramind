import { J, guard, isAdmin } from "@/lib/http";
import { getAllFeedback, updateFeedbackStatus } from "@/lib/feedback/client";
import { FeedbackStatus } from "@/lib/feedback/types";
import { z } from "zod";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const GET = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const url = new URL(req.url);
  const priority = url.searchParams.get("priority") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const category = url.searchParams.get("category") || undefined;

  const feedback = await getAllFeedback({ priority, status, category });

  return J({ ok: true, feedback });
});

export const POST = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const body = await req.json().catch(() => null);
  const actionSchema = z.object({
    id: z.string(),
    status: z.enum(["open", "in_review", "resolved", "closed"]),
    adminNotes: z.string().optional(),
  });

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return J({ error: "Invalid feedback update payload.", details: parsed.error.issues }, 400);
  }

  const { id, status, adminNotes } = parsed.data;

  const result = await updateFeedbackStatus(id, status as FeedbackStatus, adminNotes);
  return J(result);
});
