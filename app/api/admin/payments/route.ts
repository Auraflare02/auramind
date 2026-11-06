import { J, guard, isAdmin } from "@/lib/http";
import {
  getAllPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from "@/lib/payments/client";
import { z } from "zod";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export const GET = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status") || "all";
  const requests = await getAllPaymentRequests(statusFilter);

  return J({ ok: true, requests });
});

export const POST = guard(async (req) => {
  if (!isAdmin(req)) {
    return J({ error: "Unauthorized: Invalid or missing AURAMIND_ADMIN_KEY." }, 401);
  }

  const body = await req.json().catch(() => null);
  const actionSchema = z.object({
    id: z.string(),
    action: z.enum(["approve", "reject"]),
    notes: z.string().optional(),
  });

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return J({ error: "Invalid payment review payload." }, 400);
  }

  const { id, action, notes } = parsed.data;

  if (action === "approve") {
    const result = await approvePaymentRequest(id, "Admin Console");
    return J(result);
  }

  if (action === "reject") {
    const result = await rejectPaymentRequest(id, notes, "Admin Console");
    return J(result);
  }

  return J({ error: "Unknown action" }, 400);
});
