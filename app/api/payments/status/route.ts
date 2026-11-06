import { createClient } from "@/lib/supabase/server";
import { getUserPaymentRequests } from "@/lib/payments/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ isAuthenticated: false, requests: [] });
    }

    const requests = await getUserPaymentRequests(user.id);
    return NextResponse.json({
      isAuthenticated: true,
      requests,
    });
  } catch (err: any) {
    console.error("[api/payments/status GET]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load payment requests." },
      { status: 500 }
    );
  }
}
