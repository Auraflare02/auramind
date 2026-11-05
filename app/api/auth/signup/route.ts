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

    const { data, error } = await supabase.auth.signUp({
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const admin = getAdminClient();
    let hasSession = Boolean(data?.session);
    let needsConfirmation = false;

    // Persist affirmative consent records & auto-confirm user so they are never blocked
    if (data?.user?.id) {
      const userId = data.user.id;

      // 1. Confirm user email so they can immediately access their dashboard
      try {
        await admin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });
      } catch (confirmErr) {
        console.warn("[signup auto-confirm notice]:", confirmErr);
      }

      // 2. Persist affirmative consent audit records
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

      // 3. Immediately initialize user profile in public.profiles table
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

      // 4. If session was not generated, immediately sign in to establish real session cookies
      if (!hasSession) {
        try {
          const { data: signInData } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          if (signInData?.session) {
            hasSession = true;
            data.session = signInData.session;
          }
        } catch (signInErr) {
          console.warn("[signup immediate sign-in notice]:", signInErr);
        }
      }
    }

    if (!hasSession) {
      needsConfirmation = true;
    }

    return NextResponse.json({
      ok: true,
      user: data.user,
      needsConfirmation,
      hasSession,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create account." }, { status: 500 });
  }
}
