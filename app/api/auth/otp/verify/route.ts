import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { recordConsent } from "@/lib/consent";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, token, isSignup, fullName, agreeTerms, consentPersonalData, next } = body;

    if (!phone || !token) {
      return NextResponse.json(
        { error: "Mobile number and verification code are required." },
        { status: 400 }
      );
    }

    let cleanedPhone = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (!cleanedPhone.startsWith("+")) {
      if (/^\d{10}$/.test(cleanedPhone)) {
        cleanedPhone = `+91${cleanedPhone}`;
      } else {
        cleanedPhone = `+${cleanedPhone}`;
      }
    }

    const cleanedToken = token.trim();
    if (!/^\d{4,8}$/.test(cleanedToken)) {
      return NextResponse.json(
        { error: "Invalid verification code. Please enter the 6-digit code received via SMS." },
        { status: 400 }
      );
    }

    if (isSignup) {
      if (agreeTerms !== true) {
        return NextResponse.json(
          { error: "You must agree to the AuraMind Terms & Conditions to create an account." },
          { status: 400 }
        );
      }
      if (consentPersonalData !== true) {
        return NextResponse.json(
          { error: "You must consent to the processing of your personal information to proceed with account creation." },
          { status: 400 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Authentication system is not configured on the server." },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    });

    const { data, error } = await supabase.auth.verifyOtp({
      phone: cleanedPhone,
      token: cleanedToken,
      type: "sms",
    });

    if (error) {
      console.warn("[otp-verify] Supabase verifyOtp error:", error);
      if (
        error.message.toLowerCase().includes("token has expired") ||
        error.message.toLowerCase().includes("otp has expired")
      ) {
        return NextResponse.json(
          { error: "Verification code has expired. Please request a new code." },
          { status: 400 }
        );
      }
      if (
        error.message.toLowerCase().includes("invalid token") ||
        error.message.toLowerCase().includes("token is invalid") ||
        error.message.toLowerCase().includes("incorrect")
      ) {
        return NextResponse.json(
          { error: "Incorrect verification code. Please check your SMS and try again." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message || "Failed to verify code." },
        { status: 400 }
      );
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json(
        { error: "Verification succeeded but user session could not be established." },
        { status: 500 }
      );
    }

    // Upsert user profile in public.profiles table
    try {
      const admin = getAdminClient();
      const resolvedName =
        fullName?.trim() ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        `Pioneer ${cleanedPhone.slice(-4)}`;

      await admin.from("profiles").upsert(
        {
          id: user.id,
          full_name: resolvedName,
          email: user.email || null,
          created_at: user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      // Record affirmative consent if signup
      if (isSignup) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const ua = request.headers.get("user-agent") || undefined;

        await recordConsent({
          userId: user.id,
          consentType: "terms_and_conditions",
          policyName: "Terms & Conditions",
          consented: true,
          ipAddress: ip,
          userAgent: ua,
        });

        await recordConsent({
          userId: user.id,
          consentType: "personal_data_processing",
          policyName: "Privacy Policy",
          consented: true,
          ipAddress: ip,
          userAgent: ua,
        });
      }
    } catch (dbErr) {
      console.warn("[otp-verify-profile-upsert-warning]", dbErr);
    }

    const safeDestination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

    return NextResponse.json({
      ok: true,
      user,
      destination: safeDestination,
    });
  } catch (err: any) {
    console.error("[otp-verify-exception]", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while verifying OTP." },
      { status: 500 }
    );
  }
}
