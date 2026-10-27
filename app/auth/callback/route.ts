import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { recordConsent, POLICY_VERSIONS } from "@/lib/consent";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Validate next path against open-redirect vulnerabilities
  let next = requestUrl.searchParams.get("next") || "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    next = "/dashboard";
  }

  // Handle OAuth errors or cancellation
  if (error) {
    console.error("[auth callback error]", { error, errorDescription });
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    );
  }

  if (code) {
    try {
      const supabase = createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("[auth exchange error]", exchangeError.message);
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
      }

      // Ensure user profile is registered in public.profiles table
      const user = data.user;
      if (user) {
        try {
          const admin = getAdminClient();
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "AuraMind Pioneer";
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          await admin.from("profiles").upsert(
            {
              id: user.id,
              full_name: fullName,
              email: user.email || "",
              avatar_url: avatarUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

          // If first-time OAuth signin, record affirmative consent audit records
          if (!user.user_metadata?.terms_accepted) {
            const nowIso = new Date().toISOString();
            const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
            const userAgent = request.headers.get("user-agent") || undefined;

            await Promise.allSettled([
              recordConsent({
                userId: user.id,
                consentType: "terms_and_conditions",
                policyName: "Terms & Conditions",
                policyVersion: POLICY_VERSIONS.terms,
                consented: true,
                ipAddress,
                userAgent,
              }),
              recordConsent({
                userId: user.id,
                consentType: "personal_data_processing",
                policyName: "Privacy Policy",
                policyVersion: POLICY_VERSIONS.privacy,
                consented: true,
                ipAddress,
                userAgent,
              }),
              admin.auth.admin.updateUserById(user.id, {
                user_metadata: {
                  ...user.user_metadata,
                  terms_accepted: true,
                  terms_accepted_at: nowIso,
                  terms_version: POLICY_VERSIONS.terms,
                  privacy_consented: true,
                  privacy_consented_at: nowIso,
                  privacy_version: POLICY_VERSIONS.privacy,
                  auth_provider: "google",
                },
              }),
            ]);
          }
        } catch (profileError) {
          // If profile sync fails, don't block user session
          console.warn("[profile sync notice]", profileError);
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (e: any) {
      console.error("[auth callback unexpected exception]", e);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent("Authentication exchange failed.")}`, requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
