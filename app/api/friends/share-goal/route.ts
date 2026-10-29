import { createClient } from "@/lib/supabase/server";
import { toggleGoalSharing } from "@/lib/friends/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { goalId, isShared, caption } = body;

    if (!goalId || typeof goalId !== "string") {
      return NextResponse.json({ error: "Goal ID is required." }, { status: 400 });
    }

    if (typeof isShared !== "boolean") {
      return NextResponse.json({ error: "isShared boolean is required." }, { status: 400 });
    }

    const result = await toggleGoalSharing(user.id, goalId, isShared, caption);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/friends/share-goal]", err);
    return NextResponse.json(
      { error: err.message || "Failed to update goal sharing." },
      { status: 400 }
    );
  }
}
