import { getAdminClient } from "@/lib/supabase/admin";
import { updateUserSubscription, activatePlatinumBeta } from "@/lib/subscription/client";
import { SubscriptionTier, BillingCycle } from "@/lib/subscription/types";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";

export interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  username?: string;
  auramindId?: string;
  tier: SubscriptionTier;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  transactionId: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store for offline development, automated tests, and graceful fallback
export const inMemoryPaymentRequests = new Map<string, PaymentRequest>();

/**
 * Submits a new payment request with UPI transaction ID.
 */
export async function submitPaymentRequest(params: {
  userId: string;
  userEmail: string;
  tier: SubscriptionTier;
  billingCycle?: BillingCycle;
  amount?: number;
  transactionId: string;
  notes?: string;
}): Promise<{ ok: boolean; request: PaymentRequest; message: string }> {
  const admin = getAdminClient();
  const cleanTxId = (params.transactionId || "").trim();

  if (!cleanTxId || cleanTxId.length < 4) {
    throw new Error("A valid UPI Transaction ID / UTR reference number is required.");
  }

  const tier = params.tier;
  if (!SUBSCRIPTION_PLANS[tier]) {
    throw new Error(`Invalid plan tier: ${tier}`);
  }

  const plan = SUBSCRIPTION_PLANS[tier];
  const billingCycle = params.billingCycle || "monthly";
  const isBeta = tier === "beta" || tier === "platinum_beta";
  const defaultAmount =
    isBeta
      ? 99
      : billingCycle === "annual"
      ? plan.annualPriceMonthly * 12
      : plan.monthlyPriceIntro || plan.monthlyPriceRegular;
  const amount = params.amount && params.amount > 0 ? params.amount : defaultAmount;

  // Enforce server-side 100-user limit for Beta Programme
  if (isBeta) {
    let betaCount = 0;
    try {
      const { count } = await admin
        .from("payment_requests")
        .select("id", { count: "exact", head: true })
        .in("tier", ["beta", "platinum_beta"])
        .in("status", ["pending", "approved"]);
      betaCount = count || 0;
    } catch {
      betaCount = 0;
    }

    for (const item of Array.from(inMemoryPaymentRequests.values())) {
      if ((item.tier === "beta" || item.tier === "platinum_beta") && (item.status === "pending" || item.status === "approved")) {
        betaCount++;
      }
    }

    const maxBetaUsers = 100;
    if (betaCount >= maxBetaUsers) {
      throw new Error(
        `The AuraMind 100-User Platinum Beta Programme has reached maximum capacity (${maxBetaUsers}/${maxBetaUsers} slots reserved). Please select Gold, Platinum, or Diamond.`
      );
    }
  }

  // Resolve user profile info
  let userName = "";
  let username = "";
  let auramindId = "";

  try {
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, username, auramind_id")
      .eq("id", params.userId)
      .maybeSingle();

    if (profile) {
      userName = profile.full_name || "";
      username = profile.username || "";
      auramindId = profile.auramind_id || "";
    }
  } catch (err) {
    console.warn("[payment] Error loading profile details:", err);
  }

  const nowIso = new Date().toISOString();
  const generatedId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const newRequest: PaymentRequest = {
    id: generatedId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: userName || params.userEmail.split("@")[0],
    username: username || undefined,
    auramindId: auramindId || undefined,
    tier,
    billingCycle,
    amount,
    currency: "INR",
    transactionId: cleanTxId,
    status: "pending",
    notes: params.notes || undefined,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  // Pre-seed in-memory store so it is immediately queryable
  inMemoryPaymentRequests.set(generatedId, newRequest);

  // 1. Try to save to Supabase
  try {
    const { data, error } = await admin
      .from("payment_requests")
      .insert({
        id: generatedId,
        user_id: params.userId,
        user_email: params.userEmail,
        user_name: newRequest.userName,
        username: newRequest.username,
        auramind_id: newRequest.auramindId,
        tier,
        billing_cycle: billingCycle,
        amount,
        currency: "INR",
        transaction_id: cleanTxId,
        status: "pending",
        notes: params.notes,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      console.warn("[payment] Supabase insert warning (falling back to memory):", error.message);
      inMemoryPaymentRequests.set(generatedId, newRequest);
    } else if (data) {
      inMemoryPaymentRequests.set(data.id, {
        id: data.id,
        userId: data.user_id,
        userEmail: data.user_email,
        userName: data.user_name,
        username: data.username,
        auramindId: data.auramind_id,
        tier: data.tier,
        billingCycle: data.billing_cycle,
        amount: data.amount,
        currency: data.currency,
        transactionId: data.transaction_id,
        status: data.status,
        notes: data.notes,
        reviewedBy: data.reviewed_by,
        reviewedAt: data.reviewed_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      });
      return {
        ok: true,
        request: inMemoryPaymentRequests.get(data.id)!,
        message: "Payment submitted successfully! Admin will verify and activate your plan within 6 hours.",
      };
    }
  } catch (err) {
    console.warn("[payment] Database exception (using memory store):", err);
    inMemoryPaymentRequests.set(generatedId, newRequest);
  }

  return {
    ok: true,
    request: newRequest,
    message: "Payment submitted successfully! Admin will verify and activate your plan within 6 hours.",
  };
}

/**
 * Retrieves payment requests for a specific user.
 */
export async function getUserPaymentRequests(userId: string): Promise<PaymentRequest[]> {
  const admin = getAdminClient();
  const results: PaymentRequest[] = [];

  try {
    const { data } = await admin
      .from("payment_requests")
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
          username: row.username,
          auramindId: row.auramind_id,
          tier: row.tier,
          billingCycle: row.billing_cycle,
          amount: row.amount,
          currency: row.currency,
          transactionId: row.transaction_id,
          status: row.status,
          notes: row.notes,
          reviewedBy: row.reviewed_by,
          reviewedAt: row.reviewed_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    }
  } catch (err) {
    console.warn("[payment] Error reading user requests from DB:", err);
  }

  // Merge in-memory records
  for (const item of Array.from(inMemoryPaymentRequests.values())) {
    if (item.userId === userId && !results.some((r) => r.id === item.id)) {
      results.push(item);
    }
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results;
}

/**
 * Retrieves all payment requests (for Admin view).
 */
export async function getAllPaymentRequests(filterStatus?: string): Promise<PaymentRequest[]> {
  const admin = getAdminClient();
  const results: PaymentRequest[] = [];

  try {
    let query = admin.from("payment_requests").select("*").order("created_at", { ascending: false }).limit(150);

    if (filterStatus && filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      for (const row of data) {
        results.push({
          id: row.id,
          userId: row.user_id,
          userEmail: row.user_email,
          userName: row.user_name,
          username: row.username,
          auramindId: row.auramind_id,
          tier: row.tier,
          billingCycle: row.billing_cycle,
          amount: row.amount,
          currency: row.currency,
          transactionId: row.transaction_id,
          status: row.status,
          notes: row.notes,
          reviewedBy: row.reviewed_by,
          reviewedAt: row.reviewed_at,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      }
    }
  } catch (err) {
    console.warn("[payment] Error reading all requests from DB:", err);
  }

  // Merge in-memory items
  for (const item of Array.from(inMemoryPaymentRequests.values())) {
    if (!filterStatus || filterStatus === "all" || item.status === filterStatus) {
      if (!results.some((r) => r.id === item.id)) {
        results.push(item);
      }
    }
  }

  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return results;
}

/**
 * Approves a payment request and instantly activates the user's plan.
 */
export async function approvePaymentRequest(
  requestId: string,
  adminIdentifier: string = "Admin"
): Promise<{ ok: boolean; request: PaymentRequest; message: string }> {
  const admin = getAdminClient();
  const nowIso = new Date().toISOString();

  // Find the request
  let req = inMemoryPaymentRequests.get(requestId);
  if (!req) {
    try {
      const { data } = await admin
        .from("payment_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (data) {
        req = {
          id: data.id,
          userId: data.user_id,
          userEmail: data.user_email,
          userName: data.user_name,
          username: data.username,
          auramindId: data.auramind_id,
          tier: data.tier,
          billingCycle: data.billing_cycle,
          amount: data.amount,
          currency: data.currency,
          transactionId: data.transaction_id,
          status: data.status,
          notes: data.notes,
          reviewedBy: data.reviewed_by,
          reviewedAt: data.reviewed_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("[payment] Error fetching request for approval:", err);
    }
  }

  if (!req) {
    throw new Error(`Payment request ${requestId} not found.`);
  }

  // 1. Activate the subscription for the user
  const isBeta = req.tier === "beta" || req.tier === "platinum_beta";
  if (isBeta) {
    await activatePlatinumBeta(req.userId, "approved");
  } else {
    await updateUserSubscription(req.userId, req.tier, req.billingCycle);
  }

  // 2. Mark payment request as approved in database & memory
  req.status = "approved";
  req.reviewedBy = adminIdentifier;
  req.reviewedAt = nowIso;
  req.updatedAt = nowIso;
  inMemoryPaymentRequests.set(req.id, req);

  try {
    await admin
      .from("payment_requests")
      .update({
        status: "approved",
        reviewed_by: adminIdentifier,
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", requestId);
  } catch (err) {
    console.warn("[payment] Error updating payment status in DB:", err);
  }

  const successMessage = isBeta
    ? `Platinum Beta activated! User ${req.userEmail} has 20 days of complete Platinum access (up to 3 goals, 15 friends, 60 AI calls, WhatsApp check-ins, and Google Calendar).`
    : `Plan activated successfully! User ${req.userEmail} upgraded to ${SUBSCRIPTION_PLANS[req.tier].name}.`;

  return {
    ok: true,
    request: req,
    message: successMessage,
  };
}

/**
 * Rejects a payment request.
 */
export async function rejectPaymentRequest(
  requestId: string,
  notes?: string,
  adminIdentifier: string = "Admin"
): Promise<{ ok: boolean; request: PaymentRequest; message: string }> {
  const admin = getAdminClient();
  const nowIso = new Date().toISOString();

  let req = inMemoryPaymentRequests.get(requestId);
  if (!req) {
    try {
      const { data } = await admin
        .from("payment_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (data) {
        req = {
          id: data.id,
          userId: data.user_id,
          userEmail: data.user_email,
          userName: data.user_name,
          username: data.username,
          auramindId: data.auramind_id,
          tier: data.tier,
          billingCycle: data.billing_cycle,
          amount: data.amount,
          currency: data.currency,
          transactionId: data.transaction_id,
          status: data.status,
          notes: data.notes,
          reviewedBy: data.reviewed_by,
          reviewedAt: data.reviewed_at,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("[payment] Error fetching request for rejection:", err);
    }
  }

  if (!req) {
    throw new Error(`Payment request ${requestId} not found.`);
  }

  req.status = "rejected";
  req.notes = notes || req.notes || "Invalid transaction ID or payment not received.";
  req.reviewedBy = adminIdentifier;
  req.reviewedAt = nowIso;
  req.updatedAt = nowIso;
  inMemoryPaymentRequests.set(req.id, req);

  try {
    await admin
      .from("payment_requests")
      .update({
        status: "rejected",
        notes: req.notes,
        reviewed_by: adminIdentifier,
        reviewed_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", requestId);
  } catch (err) {
    console.warn("[payment] Error updating payment status in DB:", err);
  }

  return {
    ok: true,
    request: req,
    message: `Payment request marked as rejected.`,
  };
}
