import { getAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_PLANS, AI_CALLING_CONFIG } from "./config";
import { SubscriptionTier, SubscriptionStatus, BillingCycle, UserSubscription, PlatinumBetaRecord } from "./types";

// In-memory store for offline/testing/graceful fallback
export const inMemorySubscriptions = new Map<string, {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startedAt: string;
  renewsAt: string;
  aiCallsUsed: number;
}>();

// In-memory store for Platinum Beta records
export const inMemoryPlatinumBeta = new Map<string, PlatinumBetaRecord>();

/**
 * Retrieves the dedicated Platinum Beta record for a user, if active.
 */
export async function getPlatinumBetaRecord(userId: string): Promise<PlatinumBetaRecord | null> {
  const now = Date.now();

  // 1. Check in-memory store
  const mem = inMemoryPlatinumBeta.get(userId);
  if (mem) {
    const isExpired = new Date(mem.betaExpiryDate).getTime() <= now;
    const daysRemaining = Math.max(0, Math.ceil((new Date(mem.betaExpiryDate).getTime() - now) / (24 * 60 * 60 * 1000)));
    return {
      ...mem,
      isExpired,
      daysRemaining,
    };
  }

  // 2. Check Supabase platinum_beta_access table
  const admin = getAdminClient();
  try {
    const { data } = await admin
      .from("platinum_beta_access")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      const isExpired = new Date(data.beta_expiry_date).getTime() <= now;
      const daysRemaining = Math.max(0, Math.ceil((new Date(data.beta_expiry_date).getTime() - now) / (24 * 60 * 60 * 1000)));
      const rec: PlatinumBetaRecord = {
        userId: data.user_id,
        paymentStatus: data.payment_status || "approved",
        betaActivationDate: data.beta_activation_date,
        betaExpiryDate: data.beta_expiry_date,
        planType: "platinum_beta",
        maxActiveGoals: data.max_active_goals || 3,
        maxFriends: data.max_friends || 15,
        totalCallCredits: data.total_call_credits || 20,
        callsConsumed: data.ai_calls_consumed || 0,
        totalCallDurationSeconds: data.total_call_duration_seconds || 0,
        maxCallDurationSeconds: data.max_call_duration_seconds || 90,
        whatsAppUsage: data.whatsapp_messages_sent || 0,
        paymentReference: data.payment_reference || undefined,
        whatsAppEligibility: data.whatsapp_eligible ?? true,
        calendarEligibility: data.calendar_eligible ?? true,
        isExpired,
        daysRemaining,
      };
      inMemoryPlatinumBeta.set(userId, rec);
      return rec;
    }
  } catch (err) {
    console.warn("[subscription] Error reading platinum_beta_access from DB:", err);
  }

  return null;
}

/**
 * Activates dedicated Platinum Beta access for a user for strictly 20 days.
 */
export async function activatePlatinumBeta(
  userId: string,
  paymentStatus: "approved" | "pending" = "approved",
  paymentReference?: string
): Promise<{ success: boolean; record: PlatinumBetaRecord; message: string }> {
  const admin = getAdminClient();
  const now = new Date();
  const activationDate = now.toISOString();
  // Strictly 20 days duration
  const expiryDate = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString();

  const record: PlatinumBetaRecord = {
    userId,
    paymentStatus,
    betaActivationDate: activationDate,
    betaExpiryDate: expiryDate,
    planType: "platinum_beta",
    maxActiveGoals: 3,
    maxFriends: 15,
    totalCallCredits: 20,
    callsConsumed: 0,
    totalCallDurationSeconds: 0,
    maxCallDurationSeconds: 90,
    whatsAppUsage: 0,
    paymentReference: paymentReference || undefined,
    whatsAppEligibility: true,
    calendarEligibility: true,
    isExpired: false,
    daysRemaining: 20,
  };

  inMemoryPlatinumBeta.set(userId, record);

  // Update subscription to platinum_beta
  await updateUserSubscription(userId, "platinum_beta", "monthly");

  // Save to DB table platinum_beta_access
  try {
    await admin.from("platinum_beta_access").upsert(
      {
        user_id: userId,
        payment_status: paymentStatus,
        beta_activation_date: activationDate,
        beta_expiry_date: expiryDate,
        plan_type: "platinum_beta",
        max_active_goals: 3,
        max_friends: 15,
        ai_call_allowance: 20,
        total_call_credits: 20,
        ai_calls_consumed: 0,
        total_call_duration_seconds: 0,
        max_call_duration_seconds: 90,
        whatsapp_messages_sent: 0,
        payment_reference: paymentReference || null,
        whatsapp_eligible: true,
        calendar_eligible: true,
        updated_at: activationDate,
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.warn("[subscription] DB notice (persisted in memory):", err);
  }

  return {
    success: true,
    record,
    message: "AuraMind Platinum Beta activated! You have 20 days of complete Platinum access (3 goals, 15 friends, 20 AI calls capped at 90s, WhatsApp & Calendar).",
  };
}

/**
 * Retrieves the full subscription details and usage quota for a user.
 * Defaults to 'gold' tier if no custom plan has been assigned.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const admin = getAdminClient();

  let tier: SubscriptionTier = "gold";
  let status: SubscriptionStatus = "active";
  let billingCycle: BillingCycle = "monthly";
  let startedAt = new Date().toISOString();
  let renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  let aiCallsUsed = 0;

  // 1. Check in-memory store
  const mem = inMemorySubscriptions.get(userId);
  if (mem) {
    tier = mem.tier;
    status = mem.status;
    billingCycle = mem.billingCycle;
    startedAt = mem.startedAt;
    renewsAt = mem.renewsAt;
    aiCallsUsed = mem.aiCallsUsed;
  } else {
    // 2. Check database profile
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("subscription_tier, subscription_status, subscription_started_at, subscription_renews_at, ai_calls_used_this_month")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        if (profile.subscription_tier && (profile.subscription_tier in SUBSCRIPTION_PLANS)) {
          tier = profile.subscription_tier as SubscriptionTier;
        }
        if (profile.subscription_status) {
          status = profile.subscription_status as SubscriptionStatus;
        }
        if (profile.subscription_started_at) {
          startedAt = profile.subscription_started_at;
        }
        if (profile.subscription_renews_at) {
          renewsAt = profile.subscription_renews_at;
        }
        if (typeof profile.ai_calls_used_this_month === "number") {
          aiCallsUsed = profile.ai_calls_used_this_month;
        }
      }
    } catch (err) {
      console.warn("[subscription] Error fetching subscription from profile:", err);
    }
  }

  // Check 20-day automatic expiration for beta tiers
  const isBeta = tier === "beta" || tier === "platinum_beta";
  const now = Date.now();
  const isExpired = isBeta && new Date(renewsAt).getTime() <= now;

  if (isExpired && status === "active") {
    status = "expired";
    try {
      await admin.from("profiles").update({ subscription_status: "expired" }).eq("id", userId);
    } catch {}
  }

  const platinumBeta = isBeta ? await getPlatinumBetaRecord(userId) : undefined;
  const plan = SUBSCRIPTION_PLANS[tier] || SUBSCRIPTION_PLANS.gold;

  // 3. Count active goals for usage
  let activeGoalsCount = 0;
  try {
    const { count } = await admin
      .from("requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .neq("status", "archived")
      .neq("status", "completed");
    activeGoalsCount = count || 0;
  } catch {
    activeGoalsCount = 0;
  }

  // 4. Count accepted friends for usage
  let friendsCount = 0;
  try {
    const [byUser, byFriend] = await Promise.all([
      admin.from("friendships").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "accepted"),
      admin.from("friendships").select("id", { count: "exact", head: true }).eq("friend_id", userId).eq("status", "accepted"),
    ]);
    friendsCount = (byUser.count || 0) + (byFriend.count || 0);
  } catch {
    friendsCount = 0;
  }

  // 5. Check if calendar is connected
  let calendarConnected = false;
  try {
    const { data: cal } = await admin
      .from("google_calendars")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    calendarConnected = Boolean(cal);
  } catch {
    calendarConnected = false;
  }

  return {
    userId,
    tier,
    status,
    billingCycle,
    startedAt,
    renewsAt,
    plan,
    platinumBeta: platinumBeta || undefined,
    usage: {
      activeGoals: activeGoalsCount,
      maxGoals: plan.maxGoals,
      friendsCount,
      maxFriends: plan.maxFriends,
      aiCallsUsedThisMonth: aiCallsUsed,
      aiCallsAllowance: plan.aiCallsPerMonth,
      whatsAppEnabled: plan.whatsAppCheckins,
      calendarConnected,
    },
  };
}

/**
 * Activates or upgrades a user's subscription to a chosen tier.
 */
export async function updateUserSubscription(
  userId: string,
  tier: SubscriptionTier,
  billingCycle: BillingCycle = "monthly"
): Promise<{ success: boolean; message: string; subscription: UserSubscription }> {
  if (!SUBSCRIPTION_PLANS[tier]) {
    throw new Error(`Invalid subscription plan: '${tier}'. Must be gold, platinum, diamond, beta, or platinum_beta.`);
  }

  const admin = getAdminClient();
  const now = new Date();
  const startedAt = now.toISOString();
  const isBeta = tier === "beta" || tier === "platinum_beta";
  const renewalDays = isBeta ? 20 : billingCycle === "annual" ? 365 : 30;
  const renewsAt = new Date(now.getTime() + renewalDays * 24 * 60 * 60 * 1000).toISOString();

  // Update in-memory fallback
  inMemorySubscriptions.set(userId, {
    tier,
    status: "active",
    billingCycle,
    startedAt,
    renewsAt,
    aiCallsUsed: 0,
  });

  // Update database profile
  try {
    await admin.from("profiles").upsert(
      {
        id: userId,
        subscription_tier: tier,
        subscription_status: "active",
        subscription_started_at: startedAt,
        subscription_renews_at: renewsAt,
        ai_calls_used_this_month: 0,
        updated_at: startedAt,
      },
      { onConflict: "id" }
    );

    // Record in subscription audit table
    await admin.from("user_subscriptions").insert({
      user_id: userId,
      tier,
      status: "active",
      billing_cycle: billingCycle,
      started_at: startedAt,
      renews_at: renewsAt,
    });
  } catch (err) {
    console.warn("[subscription] DB notice (persisted in memory):", err);
  }

  const sub = await getUserSubscription(userId);
  const plan = SUBSCRIPTION_PLANS[tier];

  return {
    success: true,
    message: isBeta
      ? `Welcome to ${plan.name}! Your account now has 20 days of complete Platinum access (up to ${plan.maxGoals} goals, ${plan.maxFriends} friends, ${plan.aiCallsPerMonth} AI calls, WhatsApp check-ins, and Google Calendar). Access will expire automatically after 20 days with zero auto-renewals.`
      : `Welcome to ${plan.name}! Your account now has access to ${plan.maxGoals} goals, ${plan.maxFriends} friends, and ${plan.coreLevelPhilosophy}`,
    subscription: sub,
  };
}

/**
 * Checks whether the user is eligible to add another goal under their plan limits.
 */
export async function checkGoalLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  planName: string;
  reason?: string;
}> {
  const sub = await getUserSubscription(userId);

  if (sub.status === "expired") {
    return {
      allowed: false,
      currentCount: sub.usage.activeGoals,
      maxAllowed: 0,
      planName: `${sub.plan.name} (Expired)`,
      reason: "Your 20-day Platinum Beta access has expired. Please upgrade to continue adding new goals.",
    };
  }

  const allowed = sub.usage.activeGoals < sub.plan.maxGoals;
  return {
    allowed,
    currentCount: sub.usage.activeGoals,
    maxAllowed: sub.plan.maxGoals,
    planName: sub.plan.name,
  };
}

/**
 * Checks whether the user is eligible to connect with another friend under their plan limits.
 */
export async function checkFriendLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  planName: string;
  reason?: string;
}> {
  const sub = await getUserSubscription(userId);

  if (sub.status === "expired") {
    return {
      allowed: false,
      currentCount: sub.usage.friendsCount,
      maxAllowed: 0,
      planName: `${sub.plan.name} (Expired)`,
      reason: "Your 20-day Platinum Beta access has expired. Please upgrade to connect with new partners.",
    };
  }

  const allowed = sub.usage.friendsCount < sub.plan.maxFriends;
  return {
    allowed,
    currentCount: sub.usage.friendsCount,
    maxAllowed: sub.plan.maxFriends,
    planName: sub.plan.name,
  };
}

/**
 * Verifies whether a user can initiate an AI voice call under their subscription tier limits.
 */
export async function checkAiCallingAllowance(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  used: number;
  allowance: number;
  featureEnabled: boolean;
}> {
  if (!AI_CALLING_CONFIG.enabled) {
    return {
      allowed: false,
      reason: AI_CALLING_CONFIG.statusNote,
      used: 0,
      allowance: 0,
      featureEnabled: false,
    };
  }

  const sub = await getUserSubscription(userId);

  if (sub.status === "expired") {
    return {
      allowed: false,
      reason: "Your 20-day Platinum Beta access has expired. Please upgrade to Platinum or Diamond to unlock AI calls.",
      used: sub.usage.aiCallsUsedThisMonth,
      allowance: 0,
      featureEnabled: true,
    };
  }

  const allowance = sub.usage.aiCallsAllowance;
  const used = sub.usage.aiCallsUsedThisMonth;

  if (allowance <= 0) {
    return {
      allowed: false,
      reason: `Your current ${sub.plan.name} does not include AI voice calls. Upgrade to Platinum (60 calls/mo) or Diamond (450 calls/mo) to unlock AI phone calls.`,
      used,
      allowance,
      featureEnabled: true,
    };
  }

  if (used >= allowance) {
    return {
      allowed: false,
      reason: `You have reached your AI calling allowance (${used}/${allowance} calls used). Allowance resets on your next billing cycle.`,
      used,
      allowance,
      featureEnabled: true,
    };
  }

  return {
    allowed: true,
    used,
    allowance,
    featureEnabled: true,
  };
}

/**
 * Tracks and records an AI voice call usage against a user's allowance.
 */
export async function recordAiCallUsage(
  userId: string,
  callDurationMinutes: number = 5
): Promise<{ success: boolean; callsRemaining: number; reason?: string }> {
  const allowanceCheck = await checkAiCallingAllowance(userId);
  if (!allowanceCheck.allowed) {
    return { success: false, callsRemaining: 0, reason: allowanceCheck.reason };
  }

  const admin = getAdminClient();
  const newUsed = allowanceCheck.used + 1;

  // Update in-memory subscription
  const mem = inMemorySubscriptions.get(userId);
  if (mem) {
    mem.aiCallsUsed = newUsed;
  }

  // Update in-memory platinum beta
  const pBeta = inMemoryPlatinumBeta.get(userId);
  if (pBeta) {
    pBeta.callsConsumed = newUsed;
    pBeta.aiCallsConsumed = newUsed;
  }

  // Persist to DB
  try {
    await admin.from("profiles").update({ ai_calls_used_this_month: newUsed }).eq("id", userId);
    await admin.from("platinum_beta_access").update({ ai_calls_consumed: newUsed }).eq("user_id", userId);
  } catch (err) {
    console.warn("[subscription] Error updating call usage:", err);
  }

  return {
    success: true,
    callsRemaining: Math.max(0, allowanceCheck.allowance - newUsed),
  };
}

export const recordCallUsage = recordAiCallUsage;
