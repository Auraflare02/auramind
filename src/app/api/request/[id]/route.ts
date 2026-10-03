import { NextResponse } from "next/server";
import { getServerDb } from "../../../../lib/server-db";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const code = String(id ?? "").trim().toUpperCase();

    if (!code) return NextResponse.json({ error: "Request ID is required." }, { status: 400 });

    const db = getServerDb();
    if (!db) return NextResponse.json({ error: "Request storage is not configured." }, { status: 503 });

    const { data, error } = await db
      .from("goal_requests")
      .select("request_code,goal,deadline,current_level,target_level,status,eta_at,research,plan,created_at,ready_at")
      .eq("request_code", code)
      .maybeSingle();

    if (error) {
      console.error("AuraMind request status error:", error);
      return NextResponse.json({ error: "Could not check this request." }, { status: 500 });
    }

    if (!data) return NextResponse.json({ error: "Request ID not found." }, { status: 404 });

    return NextResponse.json({
      requestId: data.request_code,
      goal: data.goal,
      deadline: data.deadline,
      currentLevel: data.current_level,
      targetLevel: data.target_level,
      status: data.status,
      etaAt: data.eta_at,
      research: data.research,
      plan: data.plan,
      createdAt: data.created_at,
      readyAt: data.ready_at
    });
  } catch (error) {
    console.error("AuraMind request status route error:", error);
    return NextResponse.json({ error: "Could not check the request." }, { status: 500 });
  }
}
