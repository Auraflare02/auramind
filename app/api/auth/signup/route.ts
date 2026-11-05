import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { recordConsent, POLICY_VERSIONS } from "@/lib/consent";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      email,
      password,
      full_name,
      next,
      agree_terms,
      consent_personal_data,
      optional_updates,
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
    }

    // Server-Side Consent Validation: Unchecked boxes must reject signup
    if (agree_terms !== true) {
      return NextResponse.json(
        { error: "You must agree to the AuraMind Terms & Conditions to create an account." },
        { status: 400 }
      );
    }

    if (consent_personal_data !== true) {
      return NextResponse.json(
        { error: "You must consent to the processing of your personal information to proceed with account creation." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase authentication is not configured on the server." }, { status: 500 });
    }

    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;
    const nextPath = next || "/dashboard";
    const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handled
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Handled
          }
        },
      },
    });

    const nowIso = new Date().toISOString();
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;

    const admin = getAdminClient();
    let authUser: any = null;
    let authSession: any = null;

    // 1. First attempt admin.auth.admin.createUser with email_confirm: true
    // This is 100% immune to Supabase public email rate limits and prevents user from being blocked
    try {
      const { data: adminCreated, error: adminErr } = await admin.auth.admin.createUser({
        email: email.trim(),
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim(),
          terms_accepted: true,
          terms_accepted_at: nowIso,
          terms_version: POLICY_VERSIONS.terms,
          privacy_consented: true,
          privacy_consented_at: nowIso,
          privacy_version: POLICY_VERSIONS.privacy,
          optional_updates_consented: Boolean(optional_updates),
          optional_updates_consented_at: optional_updates ? nowIso : null,
        },
      });

      if (adminCreated?.user) {
        authUser = adminCreated.user;
      } else if (adminErr) {
        if (
          adminErr.message.toLowerCase().includes("already registered") ||
          adminErr.message.toLowerCase().includes("unique constraint") ||
          adminErr.message.toLowerCase().includes("already exists")
        ) {
          return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 400 });
        }
        console.warn("[signup] admin.createUser notice, attempting standard signUp:", adminErr.message);
      }
    } catch (createErr) {
      console.warn("[signup] admin.createUser exception:", createErr);
    }

    // 2. If admin creation did not return a user, fallback to standard client signUp
    if (!authUser) {
      const { data: clientData, error: clientErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: full_name.trim(),
            terms_accepted: true,
            terms_accepted_at: nowIso,
            terms_version: POLICY_VERSIONS.terms,
            privacy_consented: true,
            privacy_consented_at: nowIso,
            privacy_version: POLICY_VERSIONS.privacy,
            optional_updates_consented: Boolean(optional_updates),
            optional_updates_consented_at: optional_updates ? nowIso : null,
          },
          emailRedirectTo,
        },
      });

      if (clientErr) {
        if (clientErr.message.toLowerCase().includes("already registered")) {
          return NextResponse.json({ error: "An account with this email already exists. Please log in." }, { status: 400 });
        }
        // If email rate limit was encountered, try updating user confirmation status if account was partially registered
        if (clientErr.message.toLowerCase().includes("rate limit")) {
          return NextResponse.json(
            { error: "Too many signups from this IP. Please wait a moment or sign up with Google." },
            { status: 429 }
          );
        }
        return NextResponse.json({ error: clientErr.message }, { status: 400 });
      }

      authUser = clientData?.user;
      authSession = clientData?.session;
    }

    if (!authUser) {
      return NextResponse.json({ error: "Failed to establish user account. Please try again." }, { status: 500 });
    }

    const userId = authUser.id;

    // 3. Immediately sign in with password to establish session cookies in the browser!
    if (!authSession) {
      try {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInData?.session) {
          authSession = signInData.session;
        } else if (signInErr) {
          console.warn("[signup] signInWithPassword notice:", signInErr.message);
        }
      } catch (signInErr) {
        console.warn("[signup] immediate sign-in exception:", signInErr);
      }
    }

    let hasSession = Boolean(authSession);
    let needsConfirmation = false;

    // Persist affirmative consent records & auto-confirm user
    if (userId) {
      // Auto-confirm user email in Supabase
      try {
        await admin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
      } catch (confirmErr) {
        console.warn("[signup auto-confirm notice]:", confirmErr);
      }

      // Persist affirmative consent audit records
      await Promise.allSettled([
        recordConsent({
          userId,
          consentType: "terms_and_conditions",
          policyName: "Terms & Conditions",
          policyVersion: POLICY_VERSIONS.terms,
          consented: true,
          ipAddress,
          userAgent,
        }),
        recordConsent({
          userId,
          consentType: "personal_data_processing",
          policyName: "Privacy Policy",
          policyVersion: POLICY_VERSIONS.privacy,
          consented: true,
          ipAddress,
          userAgent,
        }),
        ...(optional_updates
          ? [
              recordConsent({
                userId,
                consentType: "product_updates" as const,
                policyName: "Product Communications",
                policyVersion: POLICY_VERSIONS.product_updates,
                consented: true,
                ipAddress,
                userAgent,
              }),
            ]
          : []),
      ]);

      // Immediately initialize user profile in public.profiles table
      try {
        const usernameBase = (full_name || "user")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .slice(0, 15);
        const suffix = userId.replace(/-/g, "").slice(0, 4).toLowerCase();
        const username = `${usernameBase}_${suffix}`;
        const auramindId = `AM-${userId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

        await admin.from("profiles").upsert(
          {
            id: userId,
            full_name: full_name.trim(),
            email: email.trim(),
            username,
            auramind_id: auramindId,
            subscription_tier: "gold",
            subscription_status: "active",
            created_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: "id" }
        );
      } catch (profErr) {
        console.warn("[signup profile create notice]:", profErr);
      }
    }

    if (!hasSession) {
      needsConfirmation = true;
    }

    return NextResponse.json({
      ok: true,
      user: authUser,
      needsConfirmation,
      hasSession,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create account." }, { status: 500 });
  }
}
