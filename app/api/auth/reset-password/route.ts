import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json().catch(() => ({}));
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const supabase = createClient();
    const url = new URL(request.url);
    const redirectTo = `${url.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      console.warn("[reset password notice]", error.message);
    }

    // Always return success to protect against account enumeration
    return NextResponse.json({ ok: true, message: "Reset email dispatched if account exists." });
  } catch (err: any) {
    return NextResponse.json({ ok: true });
  }
}
