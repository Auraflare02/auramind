import { createClient } from "@/lib/supabase/server";
import { submitPaymentRequest } from "@/lib/payments/client";
import { SubscriptionTier, BillingCycle } from "@/lib/subscription/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Please log in to submit your payment details." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const tier = (body.tier || "").toLowerCase() as SubscriptionTier;
    const cycle = (body.cycle || "monthly").toLowerCase() as BillingCycle;
    const transactionId = (body.transactionId || "").trim();
    const amount = Number(body.amount) || undefined;
    const notes = body.notes ? String(body.notes).trim() : undefined;

    if (!tier || !["gold", "platinum", "diamond", "beta"].includes(tier)) {
      return NextResponse.json(
        { error: "Valid subscription tier (Gold, Platinum, Diamond, or Beta) is required." },
        { status: 400 }
      );
    }

    if (!transactionId || transactionId.length < 4) {
      return NextResponse.json(
        { error: "A valid UPI Transaction ID / UTR reference number is required." },
        { status: 400 }
      );
    }

    const result = await submitPaymentRequest({
      userId: user.id,
      userEmail: user.email || "user@auramind.ai",
      tier,
      billingCycle: cycle,
      amount,
      transactionId,
      notes,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/payments/submit POST]", err);
    return NextResponse.json(
      { error: err.message || "Failed to record payment submission." },
      { status: 500 }
    );
  }
}
