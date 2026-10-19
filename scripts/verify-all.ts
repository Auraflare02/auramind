import assert from "assert";
import { GOAL_CATEGORIES, getCategoryConfig, formatLevel } from "../lib/categories";
import { Ctx, Plan, Checkin, TimerSessionInput } from "../lib/schemas";
import { fallbackPlan, phaseOf } from "../lib/fallback";
import { calculateDailyMetrics, calculateWeeklyMetrics, computeUserStats } from "../lib/analysis";
import { generateRequestCode, generateSessionToken, isRequestCode } from "../lib/http";
import { CheckinRecord, FocusSessionRecord } from "../lib/types";

console.log("==================================================");
console.log("RUNNING AURAMIND COMPREHENSIVE VERIFICATION SUITE");
console.log("==================================================");

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`\x1b[32m✓ PASS\x1b[0m: ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`\x1b[31m✗ FAIL\x1b[0m: ${name}`);
    console.error(`  Error: ${err.message}`);
    testsFailed++;
  }
}

// 1. Categories & Levels
test("Category Configuration - All 7 Categories defined", () => {
  assert.strictEqual(GOAL_CATEGORIES.length, 7);
  const ids = GOAL_CATEGORIES.map((c) => c.id);
  assert.ok(ids.includes("language_learning"));
  assert.ok(ids.includes("coding_technology"));
  assert.ok(ids.includes("education_exams"));
  assert.ok(ids.includes("career_development"));
  assert.ok(ids.includes("business_entrepreneurship"));
  assert.ok(ids.includes("fitness_personal"));
  assert.ok(ids.includes("other"));
});

test("Language Learning CEFR Levels", () => {
  const langConfig = getCategoryConfig("language_learning");
  assert.ok(langConfig.hasLanguageField);
  const levelIds = langConfig.levels.map((l) => l.id);
  assert.ok(levelIds.includes("pre_a1"));
  assert.ok(levelIds.includes("a1"));
  assert.ok(levelIds.includes("b2"));
  assert.ok(levelIds.includes("c2"));
  assert.ok(levelIds.includes("custom"));

  const formatted = formatLevel("language_learning", "b2");
  assert.ok(formatted.includes("B2"));
});

test("Custom Level Preservation", () => {
  const custom = formatLevel("coding_technology", "custom", "Staff Engineer Architecture");
  assert.strictEqual(custom, "Staff Engineer Architecture");
});

// 2. Schemas & Input Validation
test("Goal Submission Schema - Valid Context", () => {
  const valid = {
    goal: "Master Rust Systems Programming",
    category: "coding_technology",
    current_level: "beginner",
    target_level: "project_ready",
    hours: 2.5,
    focus: "morning" as const,
    fixed: "Work 9-5",
    distractions: "Phone",
    previous: "Started tutorial 3 months ago",
    constraints: "Only laptop",
    timezone: "America/New_York",
  };

  const res = Ctx.safeParse(valid);
  assert.ok(res.success);
});

test("Goal Submission Schema - Reject Invalid Hours", () => {
  const invalid = {
    goal: "Learn Spanish",
    category: "language_learning",
    current_level: "a1",
    target_level: "b1",
    hours: 20, // Max is 16
    focus: "evening" as const,
  };

  const res = Ctx.safeParse(invalid);
  assert.strictEqual(res.success, false);
});

test("Goal Submission Schema - Reject Empty Goal", () => {
  const invalid = {
    goal: "  ",
    category: "other",
    current_level: "beginner",
    target_level: "advanced",
    hours: 2,
    focus: "morning" as const,
  };

  const res = Ctx.safeParse(invalid);
  assert.strictEqual(res.success, false);
});

// 3. Fallback Planner
test("Deterministic Fallback Planner - Produces Exactly 30 Consecutive Days", () => {
  const ctx = Ctx.parse({
    goal: "Pass AWS Solutions Architect",
    category: "education_exams",
    current_level: "starting_basics",
    target_level: "exam_ready",
    hours: 3,
    focus: "morning",
    fixed: "None",
    distractions: "None",
    previous: "None",
    constraints: "None",
    timezone: "UTC",
  });

  const plan = fallbackPlan(ctx, new Date("2026-10-20T00:00:00Z"));
  assert.strictEqual(plan.days.length, 30);
  assert.ok(plan.goal_summary.length > 20);
  assert.strictEqual(plan.weekly_focus.length, 4);
  assert.ok(plan.milestones.length >= 3);

  // Validate dates are sequential
  for (let i = 0; i < 30; i++) {
    const d = plan.days[i];
    assert.strictEqual(d.day, i + 1);
    assert.ok(d.calendar_date.startsWith("2026-"));
    assert.ok(d.blocks.length >= 1 && d.blocks.length <= 4);

    // Validate block times
    d.blocks.forEach((b) => {
      assert.ok(/^([01]\d|2[0-3]):[0-5]\d$/.test(b.start));
      assert.ok(/^([01]\d|2[0-3]):[0-5]\d$/.test(b.end));
      assert.ok(b.activity.length > 2);
      assert.ok(["learn", "practice", "review", "repair", "checkpoint", "rest"].includes(b.category));
      assert.ok(["high", "medium", "low"].includes(b.priority));
    });
  }

  // Validate Plan schema parses the fallback plan
  const parsed = Plan.parse(plan);
  assert.strictEqual(parsed.days.length, 30);
});

test("Phased Progression - Foundation to Consolidation", () => {
  assert.strictEqual(phaseOf(1), "Foundation & Prerequisites");
  assert.strictEqual(phaseOf(7), "Foundation & Prerequisites");
  assert.strictEqual(phaseOf(10), "Deliberate Practice & Skill Deepening");
  assert.strictEqual(phaseOf(18), "Real-World Application & Project Work");
  assert.strictEqual(phaseOf(25), "Error Diagnostics & Repair");
  assert.strictEqual(phaseOf(30), "Consolidation & Milestone Checkpoint");
});

// 4. Request Code & Security Tokens
test("Request Code Generator - Unique and Matches Format", () => {
  const code1 = generateRequestCode();
  const code2 = generateRequestCode();
  assert.notStrictEqual(code1, code2);
  assert.ok(isRequestCode(code1));
  assert.ok(isRequestCode(code2));
  assert.ok(code1.startsWith("AM-"));
  assert.strictEqual(code1.length, 19); // 'AM-' + 16 chars
});

test("Cryptographic Session Token - Secure 64-char Hex", () => {
  const token1 = generateSessionToken();
  const token2 = generateSessionToken();
  assert.notStrictEqual(token1, token2);
  assert.strictEqual(token1.length, 64);
  assert.ok(/^[0-9a-f]{64}$/.test(token1));
});

// 5. Deterministic Analytics & Reports
test("Daily Analytics - Handles Empty Check-ins Honestly", () => {
  const metrics = calculateDailyMetrics([], 3);
  assert.strictEqual(metrics.enough, false);
  assert.strictEqual(metrics.completion_pct, 0);
  assert.strictEqual(metrics.strongest_period, "Not enough data yet.");
});

test("Daily Analytics - Calculates Verified Completion and Focus Minutes", () => {
  const sampleCheckins: CheckinRecord[] = [
    {
      id: "1",
      request_id: "req-1",
      day: 1,
      planned: "Core Concept Study",
      actual: "Read chapter and took notes",
      status: "done",
      focused_min: 45,
      distraction_min: 5,
      distraction_type: null,
      reason: null,
      period: "morning",
    },
    {
      id: "2",
      request_id: "req-1",
      day: 1,
      planned: "Practice Drills",
      actual: "Solved 3 exercises",
      status: "partial",
      focused_min: 30,
      distraction_min: 15,
      distraction_type: "phone",
      reason: "phone",
      period: "morning",
    },
  ];

  const metrics = calculateDailyMetrics(sampleCheckins, 2);
  assert.strictEqual(metrics.enough, true);
  // 1 done (1.0) + 1 partial (0.5) = 1.5 / 2 = 75%
  assert.strictEqual(metrics.completion_pct, 75);
  assert.strictEqual(metrics.focused_min, 75);
  assert.strictEqual(metrics.distraction_min, 20);
  assert.strictEqual(metrics.strongest_period, "morning");
  assert.strictEqual(metrics.primary_blocker, "phone");
});

test("Weekly Analytics - Requires Minimum Check-ins for Pattern Confirmation", () => {
  const fewCheckins: CheckinRecord[] = [
    {
      id: "1",
      request_id: "req-1",
      day: 1,
      planned: "A",
      actual: "A",
      status: "done",
      focused_min: 40,
      distraction_min: 0,
      distraction_type: null,
      reason: null,
      period: "morning",
    },
  ];

  const weekly = calculateWeeklyMetrics(fewCheckins);
  assert.strictEqual(weekly.enough, false);
  assert.ok(weekly.message?.includes("Need at least 4 logged check-ins"));
});

test("Weekly Analytics - Detects Repeated Bottlenecks with Sufficient Data", () => {
  const weekCheckins: CheckinRecord[] = [
    { id: "1", request_id: "req-1", day: 1, planned: "A", actual: "A", status: "done", focused_min: 40, distraction_min: 0, distraction_type: null, reason: null, period: "morning" },
    { id: "2", request_id: "req-1", day: 2, planned: "B", actual: "B", status: "missed", focused_min: 10, distraction_min: 30, distraction_type: "phone", reason: "phone", period: "evening" },
    { id: "3", request_id: "req-1", day: 3, planned: "C", actual: "C", status: "done", focused_min: 45, distraction_min: 5, distraction_type: null, reason: null, period: "morning" },
    { id: "4", request_id: "req-1", day: 4, planned: "D", actual: "D", status: "partial", focused_min: 25, distraction_min: 20, distraction_type: "phone", reason: "phone", period: "evening" },
    { id: "5", request_id: "req-1", day: 5, planned: "E", actual: "E", status: "done", focused_min: 50, distraction_min: 0, distraction_type: null, reason: null, period: "morning" },
  ];

  const weekly = calculateWeeklyMetrics(weekCheckins);
  assert.strictEqual(weekly.enough, true);
  assert.strictEqual(weekly.strongest_period, "morning");
  assert.strictEqual(weekly.weakest_period, "evening");
  assert.strictEqual(weekly.recurring_reason, "phone");
});

// 6. XP and Achievement Computation
test("User XP and Streaks - Deterministic and Duplicate-Proof", () => {
  const checkins: CheckinRecord[] = [
    { id: "1", request_id: "req-1", day: 1, planned: "A", actual: "A", status: "done", focused_min: 40, distraction_min: 0, distraction_type: null, reason: null, period: "morning" },
    { id: "2", request_id: "req-1", day: 2, planned: "B", actual: "B", status: "done", focused_min: 40, distraction_min: 0, distraction_type: null, reason: null, period: "morning" },
    { id: "3", request_id: "req-1", day: 3, planned: "C", actual: "C", status: "done", focused_min: 40, distraction_min: 0, distraction_type: null, reason: null, period: "morning" },
  ];

  const focusSessions: FocusSessionRecord[] = [
    { id: "s1", request_id: "req-1", task_activity: "Rust Drills", duration_min: 25, actual_duration_min: 25, status: "completed", xp_awarded: 40, started_at: "2026-10-19T10:00:00Z" },
    { id: "s2", request_id: "req-1", task_activity: "Syntax Reading", duration_min: 50, actual_duration_min: 50, status: "completed", xp_awarded: 65, started_at: "2026-10-19T11:00:00Z" },
  ];

  const stats = computeUserStats(checkins, focusSessions, 3);
  assert.ok(stats.total_xp > 100);
  assert.strictEqual(stats.current_streak, 3);
  assert.strictEqual(stats.total_focus_min, 75);
  assert.strictEqual(stats.completed_sessions_count, 2);
  assert.ok(stats.unlocked_achievements.includes("first_focus"));
  assert.ok(stats.unlocked_achievements.includes("streak_3"));
});

// 7. Timer Input Validation
test("Timer Session Input Validation", () => {
  const valid = {
    request_id: "e4564c76-8805-4f90-84a1-b84742a22f36",
    task_activity: "Chapter 4 Problem Set",
    duration_min: 25,
    actual_duration_min: 25,
    status: "completed" as const,
    started_at: new Date().toISOString(),
  };

  const parsed = TimerSessionInput.safeParse(valid);
  assert.ok(parsed.success);
});

console.log("==================================================");
console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log("==================================================");

if (testsFailed > 0) {
  process.exit(1);
}
