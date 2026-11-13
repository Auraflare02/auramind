import { getAdminClient } from "@/lib/supabase/admin";
import { SUBSCRIPTION_PLANS, AI_CALLING_CONFIG } from "./config";
import { SubscriptionTier, BillingCycle, UserSubscription } from "./types";

// In-memory store for offline/testing/graceful fallback
export const inMemorySubscriptions = new Map<string, {
  tier: SubscriptionTier;
  status: "active" | "trialing" | "past_due" | "canceled";
  billingCycle: BillingCycle;
  startedAt: string;
  renewsAt: string;
  aiCallsUsed: number;
}>();

/**
 * Retrieves the full subscription details and usage quota for a user.
 * Defaults to 'gold' tier if no custom plan has been assigned.
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const admin = getAdminClient();

  let tier: SubscriptionTier = "gold";
  let status: "active" | "trialing" | "past_due" | "canceled" = "active";
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
          status = profile.subscription_status;
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
    throw new Error(`Invalid subscription plan: '${tier}'. Must be gold, platinum, diamond, or beta.`);
  }

  const admin = getAdminClient();
  const now = new Date();
  const startedAt = now.toISOString();
  const renewalDays = tier === "beta" ? 20 : billingCycle === "annual" ? 365 : 30;
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

    // Optionally record in subscription audit table
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
    message: `Welcome to ${plan.name}! Your account now has access to ${plan.maxGoals} goals, ${plan.maxFriends} friends, and ${plan.coreLevelPhilosophy}`,
    subscription: sub,
  };
}

/**
 * Checks whether the user is eligible to add another goal under their plan limits.
 */
export async function checkGoalLimit(userId: string): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; planName: string }> {
  const sub = await getUserSubscription(userId);
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
export async function checkFriendLimit(userId: string): Promise<{ allowed: boolean; currentCount: number; maxAllowed: number; planName: string }> {
  const sub = await getUserSubscription(userId);
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
      reason: `You have reached your monthly AI calling allowance (${used}/${allowance} calls used). Allowance resets on your next billing cycle.`,
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
