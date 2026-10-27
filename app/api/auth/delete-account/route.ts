import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { confirm_phrase } = body;

    // Security check: require explicit confirmation
    if (confirm_phrase !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: "Confirmation phrase mismatch. Please type 'DELETE MY ACCOUNT' to proceed." },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    const userId = user.id;

    // 1. Delete associated data explicitly or via cascade
    await Promise.allSettled([
      admin.from("user_consents").delete().eq("user_id", userId),
      admin.from("requests").delete().eq("user_id", userId),
      admin.from("profiles").delete().eq("id", userId),
    ]);

    // 2. Delete user from auth.users (cascades all foreign-key linked data)
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[delete-account] Admin deleteUser error:", deleteError);
      return NextResponse.json({ error: deleteError.message || "Failed to delete user." }, { status: 500 });
    }

    // 3. Clear session cookies
    await supabase.auth.signOut();

    return NextResponse.json({
      ok: true,
      message: "Your AuraMind account and all associated personal data have been permanently deleted.",
    });
  } catch (err: any) {
    console.error("[delete-account] Unexpected error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute account deletion." }, { status: 500 });
  }
}
