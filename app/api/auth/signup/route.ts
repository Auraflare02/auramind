import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password, full_name, next } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Full name, email, and password are required." }, { status: 400 });
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

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: full_name.trim(),
        },
        emailRedirectTo,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const needsConfirmation = data?.user && (!data.session || data.user.identities?.length === 0);

    return NextResponse.json({
      ok: true,
      user: data.user,
      needsConfirmation,
      hasSession: Boolean(data.session),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create account." }, { status: 500 });
  }
}
