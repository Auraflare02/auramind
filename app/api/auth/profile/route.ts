import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { full_name, password } = body;

    // Update user password if provided
    if (password) {
      if (typeof password !== "string" || password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
      }
      const { error: updatePassError } = await supabase.auth.updateUser({ password });
      if (updatePassError) {
        return NextResponse.json({ error: updatePassError.message }, { status: 400 });
      }
    }

    // Update user metadata and profile if full_name is provided
    if (full_name !== undefined) {
      const trimmedName = String(full_name).trim();
      const { error: updateMetaError } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });
      if (updateMetaError) {
        return NextResponse.json({ error: updateMetaError.message }, { status: 400 });
      }

      try {
        const admin = getAdminClient();
        await admin.from("profiles").upsert(
          {
            id: user.id,
            full_name: trimmedName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch {
        // Non-blocking
      }
    }

    return NextResponse.json({ ok: true, message: "Profile updated successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}
