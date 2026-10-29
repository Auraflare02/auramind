import { createClient } from "@/lib/supabase/server";
import { getDashboardFriendsData } from "@/lib/friends/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const data = await getDashboardFriendsData(user.id);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[api/friends/data]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load friends data." },
      { status: 500 }
    );
  }
}
