import { createClient } from "@/lib/supabase/server";
import { searchUsers } from "@/lib/friends/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (!q.trim() || q.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchUsers(user.id, q);
    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("[api/friends/search]", err);
    return NextResponse.json(
      { error: err.message || "Failed to search users." },
      { status: 500 }
    );
  }
}
