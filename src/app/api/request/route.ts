import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getServerDb, dbUnavailableMessage } from "../../../lib/server-db";
import { cleanString, clampNumber, isIsoDate } from "../../../lib/validation";

function requestCode() {
  return "AM-" + crypto.randomBytes(8).toString("hex").toUpperCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const goal = cleanString(body?.goal, 2000);
    const deadline = cleanString(body?.deadline, 20);
    const currentLevel = cleanString(body?.currentLevel, 500);
    const targetLevel = cleanString(body?.targetLevel, 500);
    const fixedSchedule = cleanString(body?.fixedSchedule, 3000);
    const preferredFocusTime = cleanString(body?.preferredFocusTime, 200);
    const knownDistractions = cleanString(body?.knownDistractions, 2000);
    const pastAttempts = cleanString(body?.pastAttempts, 3000);
    const constraints = cleanString(body?.constraints, 3000);
    const dailyHours = clampNumber(body?.dailyHours, 1, 12, 3);
    const timezone = cleanString(body?.timezone, 100) || "Asia/Kolkata";

    if (!goal || !deadline || !currentLevel || !targetLevel) {
      return NextResponse.json(
        { error: "Goal, deadline, current level and target level are required." },
        { status: 400 }
      );
    }

    if (!isIsoDate(deadline)) {
      return NextResponse.json({ error: "Deadline must be a valid date." }, { status: 400 });
    }

    if (goal.length < 8) {
      return NextResponse.json({ error: "Give AuraMind a little more detail about the goal." }, { status: 400 });
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
