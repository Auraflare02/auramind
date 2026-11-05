import { createClient } from "@/lib/supabase/server";
import { getUserSubscription, updateUserSubscription } from "@/lib/subscription/client";
import { SUBSCRIPTION_PLANS, COMPARISON_TABLE_ROWS, THREE_LEVELS_PHILOSOPHY } from "@/lib/subscription/config";
import { SubscriptionTier, BillingCycle } from "@/lib/subscription/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let userSubscription = null;
    if (user?.id) {
      userSubscription = await getUserSubscription(user.id);
    }

    return NextResponse.json({
      isAuthenticated: Boolean(user),
      userSubscription,
      plans: SUBSCRIPTION_PLANS,
      comparisonTable: COMPARISON_TABLE_ROWS,
      philosophy: THREE_LEVELS_PHILOSOPHY,
    });
  } catch (err: any) {
    console.error("[api/subscription GET]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load subscription details." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Authentication required to manage subscription plans." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const tier = (body.tier || "").toLowerCase() as SubscriptionTier;
    const cycle = (body.cycle || "monthly").toLowerCase() as BillingCycle;

    if (!tier || !SUBSCRIPTION_PLANS[tier]) {
      return NextResponse.json(
        { error: "Valid subscription tier (gold, platinum, or diamond) is required." },
        { status: 400 }
      );
    }

    const result = await updateUserSubscription(user.id, tier, cycle);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/subscription POST]", err);
    return NextResponse.json(
      { error: err.message || "Failed to update subscription." },
      { status: 500 }
    );
  }
}
