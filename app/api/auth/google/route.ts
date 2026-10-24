import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(
          "Supabase configuration is missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set."
        )}`,
        origin
      )
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
        } catch {
          // Handled if headers already sent
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Handled if headers already sent
        }
      },
    },
  });

  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (error) {
      console.error("[google auth server error]", error);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
      );
    }

    if (data?.url) {
      return NextResponse.redirect(data.url);
    }

    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("No authorization URL returned by authentication provider.")}`, origin)
    );
  } catch (err: any) {
    console.error("[google auth exception]", err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message || "Failed to initialize Google authentication.")}`, origin)
    );
  }
}
