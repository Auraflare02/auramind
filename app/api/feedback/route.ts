import { createClient } from "@/lib/supabase/server";
import { submitFeedback, getUserFeedback } from "@/lib/feedback/client";
import { FeedbackCategory, FeedbackPriority } from "@/lib/feedback/types";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Authentication required to view feedback history." },
        { status: 401 }
      );
    }

    const items = await getUserFeedback(user.id);
    return NextResponse.json({ ok: true, feedback: items });
  } catch (err: any) {
    console.error("[api/feedback GET]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load feedback." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const category = (body.category || "other") as FeedbackCategory;
    const description = (body.description || "").trim();
    const feature = body.feature ? String(body.feature).trim() : undefined;
    const satisfactionRating =
      typeof body.satisfactionRating === "number"
        ? Math.min(5, Math.max(1, body.satisfactionRating))
        : undefined;
    const priority = body.priority as FeedbackPriority | undefined;

    const userEmail = user?.email || body.email || "beta-user@auramind.ai";
    const userName =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      body.name ||
      userEmail.split("@")[0];

    if (!description || description.length < 5) {
      return NextResponse.json(
        { error: "Please provide a detailed description (minimum 5 characters)." },
        { status: 400 }
      );
    }

    const validCategories: FeedbackCategory[] = [
      "bug",
      "feature_request",
      "ai_quality",
      "timetable",
      "ux",
      "performance",
      "other",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid feedback category." },
        { status: 400 }
      );
    }

    const result = await submitFeedback({
      userId: user?.id,
      userEmail,
      userName,
      category,
      feature,
      description,
      satisfactionRating,
      priority,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[api/feedback POST]", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit feedback." },
      { status: 500 }
    );
  }
}
