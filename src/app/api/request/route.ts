import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServerDb, dbUnavailableMessage } from "../../../lib/server-db";

function requestCode() {
  return "AM-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const goal = String(body?.goal ?? "").trim();
    const deadline = String(body?.deadline ?? "").trim();
    const currentLevel = String(body?.currentLevel ?? "").trim();
    const targetLevel = String(body?.targetLevel ?? "").trim();
    const fixedSchedule = String(body?.fixedSchedule ?? "").trim();
    const preferredFocusTime = String(body?.preferredFocusTime ?? "").trim();
    const knownDistractions = String(body?.knownDistractions ?? "").trim();
    const pastAttempts = String(body?.pastAttempts ?? "").trim();
    const constraints = String(body?.constraints ?? "").trim();
    const dailyHours = Math.max(1, Math.min(12, Number(body?.dailyHours ?? 3)));
    const timezone = String(body?.timezone ?? "Asia/Kolkata").trim() || "Asia/Kolkata";

    if (!goal || !deadline || !currentLevel || !targetLevel) {
      return NextResponse.json(
        { error: "Goal, deadline, current level and target level are required." },
        { status: 400 }
      );
    }

    const db = getServerDb();
    if (!db) {
      return NextResponse.json({ error: dbUnavailableMessage() }, { status: 503 });
    }

    const code = requestCode();
    const { error } = await db.from("goal_requests").insert({
      request_code: code,
      goal,
      deadline,
      current_level: currentLevel,
      target_level: targetLevel,
      fixed_schedule: fixedSchedule,
      daily_hours: dailyHours,
      timezone,
      preferred_focus_time: preferredFocusTime,
      known_distractions: knownDistractions,
      past_attempts: pastAttempts,
      constraints,
      status: "pending"
    });

    if (error) {
      console.error("AuraMind request create error:", error);
      return NextResponse.json({ error: "Could not create the goal request." }, { status: 500 });
    }

    return NextResponse.json({
      requestId: code,
      status: "pending",
      message: "Goal request received. Your research window is up to 12 hours."
    });
  } catch (error) {
    console.error("AuraMind request route error:", error);
    return NextResponse.json({ error: "Could not submit the goal request." }, { status: 500 });
  }
}
