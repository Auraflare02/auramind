import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { phone, isSignup, fullName } = body;

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number." },
        { status: 400 }
      );
    }

    // Normalize phone number to E.164 standard (+[country_code][number])
    let cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (!cleaned.startsWith("+")) {
      // Default to India (+91) if 10 digits entered without country code
      if (/^\d{10}$/.test(cleaned)) {
        cleaned = `+91${cleaned}`;
      } else {
        cleaned = `+${cleaned}`;
      }
    }

    if (!/^\+[1-9]\d{7,14}$/.test(cleaned)) {
      return NextResponse.json(
        { error: "Invalid mobile number format. Please include your country code (e.g. +91 9876543210 or +1 4155552671)." },
        { status: 400 }
      );
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

    const { data, error } = await supabase.auth.signInWithOtp({
      phone: cleaned,
      options: {
        shouldCreateUser: isSignup ?? true,
        data: fullName ? { full_name: fullName.trim() } : undefined,
      },
    });

    if (error) {
      console.warn("[otp-send] Supabase signInWithOtp error:", error);

      if (
        error.message.toLowerCase().includes("unsupported phone provider") ||
        error.message.toLowerCase().includes("phone provider is not enabled") ||
        error.message.toLowerCase().includes("sms provider")
      ) {
        return NextResponse.json(
          {
            error:
              "Mobile OTP requires the Phone provider enabled in your Supabase dashboard (Authentication -> Providers -> Phone).",
          },
          { status: 503 }
        );
      }

      if (error.message.toLowerCase().includes("signups not allowed")) {
        return NextResponse.json(
          { error: "No account found with this mobile number. Please sign up first." },
          { status: 404 }
        );
      }

      if (error.message.toLowerCase().includes("rate limit") || error.status === 429) {
        return NextResponse.json(
          { error: "Too many OTP requests. Please wait 60 seconds before trying again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: error.message || "Failed to send verification code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      phone: cleaned,
      message: `Verification code sent to ${cleaned}.`,
    });
  } catch (err: any) {
    console.error("[otp-send-exception]", err);
    return NextResponse.json(
      { error: err.message || "An unexpected error occurred while sending OTP." },
      { status: 500 }
    );
  }
}
