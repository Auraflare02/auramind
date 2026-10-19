import { CheckinRecord, FocusSessionRecord, UserStats } from "./types";

export const NA = "Not enough data yet.";

export const ADVICE: Record<string, string> = {
  too_difficult: "Split the next session into a 15-min core concept review, 20-min guided drill, and 10-min recap.",
  did_not_understand: "Add a short prerequisite explainer first, then resume with smaller practical sub-tasks.",
  tired: "Shift the most demanding cognitive block to your peak focus window and keep late sessions light.",
  phone: "Leave your phone in a separate room or use Airplane mode during deliberate focus blocks.",
  social_media: "Block social apps during study intervals; designate a 10-minute browsing window only after completion.",
  youtube: "Avoid open-ended browsing. Bookmark exactly the single tutorial or resource planned for today.",
  gaming: "Schedule gaming strictly after the final study block is checked in, never before.",
  messaging: "Mute non-urgent notifications during blocks; check messages only during scheduled breaks.",
  unexpected_work: "Incorporate a 30-minute daily schedule buffer and keep a 15-minute high-yield fallback drill ready.",
  family: "Communicate your designated focus block times in advance, or shift blocks to early morning / quieter hours.",
  boredom: "Alternate task categories (switch from reading to active problem-solving) and shorten the block.",
  environment: "Relocate to a dedicated study zone with all required notes and zero visual clutter.",
  other: "Add a short reflection note in your check-in so we can pinpoint the root cause next time.",
};

export const REASON_LABELS: Record<string, string> = {
  too_difficult: "Task Too Difficult",
  did_not_understand: "Did Not Understand Concept",
  tired: "Mental or Physical Fatigue",
  phone: "Phone / Notifications",
  social_media: "Social Media Browsing",
  youtube: "Unplanned Video Browsing",
  gaming: "Gaming",
  messaging: "Chat / Messaging",
  unexpected_work: "Unexpected Work / Urgency",
  family: "Family / Social Interruption",
  boredom: "Boredom / Lack of Momentum",
  environment: "Noisy / Cluttered Environment",
  other: "Other Obstacle",
};

export const scoreStatus = (status: string): number => {
  if (status === "done") return 1.0;
  if (status === "partial") return 0.5;
  if (status === "different") return 0.75;
  return 0.0;
};

export function calculateDailyMetrics(checkins: CheckinRecord[], plannedCount = 3) {
  if (!checkins || checkins.length === 0) {
    return {
      enough: false,
      completion_pct: 0,
      planned_tasks: plannedCount,
      completed_tasks: 0,
      focused_min: 0,
      distraction_min: 0,
      strongest_period: NA,
      weakest_period: NA,
      primary_blocker: NA,
      coaching_summary: "No check-ins logged yet for this day. Complete your first block to start seeing insights.",
      tomorrow_recommendation: "Begin with your primary high-priority task during your peak focus window.",
      practical_next_action: "Review today's schedule and select your first task in the Focus Timer.",
    };
  }

  const focused_min = checkins.reduce((sum, c) => sum + (c.focused_min || 0), 0);
  const distraction_min = checkins.reduce((sum, c) => sum + (c.distraction_min || 0), 0);
  const completed_tasks = checkins.filter((c) => c.status === "done").length;
  const totalScore = checkins.reduce((sum, c) => sum + scoreStatus(c.status), 0);
  const completion_pct = Math.round((totalScore / Math.max(checkins.length, plannedCount)) * 100);

  // Analyze periods
  const periodMap: Record<string, { score: number; count: number }> = {};
  checkins.forEach((c) => {
    if (!c.period) return;
    const p = (periodMap[c.period] ||= { score: 0, count: 0 });
    p.score += scoreStatus(c.status);
    p.count += 1;
  });

  const periodRankings = Object.entries(periodMap)
    .map(([period, data]) => ({ period, avg: data.score / data.count }))
    .sort((a, b) => b.avg - a.avg);

  let strongest_period = NA;
  let weakest_period = NA;

  if (periodRankings.length >= 2 && periodRankings[0].avg !== periodRankings[periodRankings.length - 1].avg) {
    strongest_period = periodRankings[0].period;
    weakest_period = periodRankings[periodRankings.length - 1].period;
  } else if (periodRankings.length >= 1) {
    strongest_period = periodRankings[0].period;
  }

  // Analyze primary blocker
  const blockerCounts: Record<string, number> = {};
  checkins.forEach((c) => {
    const reason = c.reason || c.distraction_type;
    if (reason) {
      blockerCounts[reason] = (blockerCounts[reason] || 0) + 1;
    }
  });

  const topBlockerEntry = Object.entries(blockerCounts).sort((a, b) => b[1] - a[1])[0];
  const primary_blocker = topBlockerEntry ? topBlockerEntry[0] : NA;

  return {
    enough: true,
    completion_pct,
    planned_tasks: Math.max(checkins.length, plannedCount),
    completed_tasks,
    focused_min,
    distraction_min,
    strongest_period,
    weakest_period,
    primary_blocker,
    coaching_summary: `Completed ${completion_pct}% of planned tasks with ${focused_min} minutes of measured deep focus.`,
    tomorrow_recommendation: primary_blocker !== NA ? (ADVICE[primary_blocker] || "Protect your focus intervals.") : "Keep the momentum going.",
    practical_next_action: "Prepare your reference materials before bed so tomorrow's first block starts with zero friction.",
  };
}

export function calculateWeeklyMetrics(checkins: CheckinRecord[]) {
  if (!checkins || checkins.length < 4) {
    return {
      enough: false,
      message: `Need at least 4 logged check-ins across the week to establish verified behavioral trends (currently ${checkins?.length || 0}).`,
      total_checkins: checkins?.length || 0,
      weekly_consistency_pct: 0,
      total_focused_hours: 0,
      total_distraction_hours: 0,
      strongest_period: NA,
      weakest_period: NA,
      repeated_distraction: NA,
      recurring_reason: NA,
      major_difficulties: ["Insufficient data to determine patterns."],
      recommendations: ["Log check-ins for each study session to unlock verified weekly patterns."],
      adaptation_advisory: "Maintain the existing schedule trajectory until more behavioral points are gathered.",
    };
  }

  const total_focused_min = checkins.reduce((sum, c) => sum + (c.focused_min || 0), 0);
  const total_distraction_min = checkins.reduce((sum, c) => sum + (c.distraction_min || 0), 0);
  const totalScore = checkins.reduce((sum, c) => sum + scoreStatus(c.status), 0);
  const weekly_consistency_pct = Math.round((totalScore / checkins.length) * 100);

  // Period analysis
  const periodMap: Record<string, { score: number; count: number }> = {};
  checkins.forEach((c) => {
    if (!c.period) return;
    const p = (periodMap[c.period] ||= { score: 0, count: 0 });
    p.score += scoreStatus(c.status);
    p.count += 1;
  });

  const periodRankings = Object.entries(periodMap)
    .filter(([, v]) => v.count >= 2)
    .map(([period, data]) => ({ period, avg: data.score / data.count }))
    .sort((a, b) => b.avg - a.avg);

  const strongest_period = periodRankings.length > 0 ? periodRankings[0].period : NA;
  const weakest_period = periodRankings.length > 1 ? periodRankings[periodRankings.length - 1].period : NA;

  // Recurring bottlenecks
  const reasonCounts: Record<string, number> = {};
  const distractionCounts: Record<string, number> = {};

  checkins.forEach((c) => {
    if (c.reason) reasonCounts[c.reason] = (reasonCounts[c.reason] || 0) + 1;
    if (c.distraction_type) distractionCounts[c.distraction_type] = (distractionCounts[c.distraction_type] || 0) + 1;
  });

  const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
  const topDistraction = Object.entries(distractionCounts).sort((a, b) => b[1] - a[1])[0];

  const recurring_reason = topReason && topReason[1] >= 2 ? topReason[0] : NA;
  const repeated_distraction = topDistraction && topDistraction[1] >= 2 ? topDistraction[0] : NA;

  const recs: string[] = [];
  if (recurring_reason !== NA && ADVICE[recurring_reason]) {
    recs.push(ADVICE[recurring_reason]);
  }
  if (strongest_period !== NA && weakest_period !== NA && strongest_period !== weakest_period) {
    recs.push(`Prioritize difficult concept acquisition during ${strongest_period}s; reserve ${weakest_period}s for passive review or consolidation.`);
  }
  if (recs.length === 0) {
    recs.push("Your consistency is steady. Gradually increase deliberate challenge sets.");
  }

  return {
    enough: true,
    total_checkins: checkins.length,
    weekly_consistency_pct,
    total_focused_hours: Math.round((total_focused_min / 60) * 10) / 10,
    total_distraction_hours: Math.round((total_distraction_min / 60) * 10) / 10,
    strongest_period,
    weakest_period,
    repeated_distraction,
    recurring_reason,
    major_difficulties: recurring_reason !== NA ? [REASON_LABELS[recurring_reason] || recurring_reason] : ["No dominant bottleneck detected."],
    recommendations: recs,
    adaptation_advisory: recurring_reason !== NA
      ? `Evidence suggests adjusting the next 7 days to address recurring ${REASON_LABELS[recurring_reason] || recurring_reason}.`
      : "Steady execution cadence; no urgent structural timetable rebuild required.",
  };
}

export function computeUserStats(
  checkins: CheckinRecord[],
  focusSessions: FocusSessionRecord[],
  currentDay: number
): UserStats {
  // Focus sessions: 1 XP per actual focused minute + 15 bonus XP per completed session
  const sessionXp = (focusSessions || []).reduce((acc, s) => {
    const minXp = s.actual_duration_min || s.duration_min || 0;
    const completionBonus = s.status === "completed" ? 15 : 0;
    return acc + minXp + completionBonus;
  }, 0);

  // Checkins: 20 XP for done, 10 XP for partial, 5 XP for different
  const checkinXp = (checkins || []).reduce((acc, c) => {
    if (c.status === "done") return acc + 25;
    if (c.status === "partial") return acc + 10;
    if (c.status === "different") return acc + 15;
    return acc;
  }, 0);

  const total_xp = sessionXp + checkinXp;
  // Level curve: Level 1 at 0 XP, Level 2 at 100 XP, Level 3 at 250 XP, etc.
  const level = Math.max(1, Math.floor(Math.sqrt(total_xp / 50)) + 1);

  // Focus time calculation
  const total_focus_min = (focusSessions || []).reduce((acc, s) => acc + (s.actual_duration_min || s.duration_min || 0), 0);
  const completed_sessions_count = (focusSessions || []).filter((s) => s.status === "completed").length;
  const completed_tasks_count = (checkins || []).filter((c) => c.status === "done").length;

  // Streak calculation: check unique days with completed work
  const activeDays = new Set<number>();
  (checkins || []).forEach((c) => {
    if (c.status === "done" || c.status === "partial") activeDays.add(c.day);
  });

  let current_streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (activeDays.has(d)) {
      current_streak++;
    } else if (d < currentDay) {
      break;
    }
  }

  // Achievements evaluation
  const unlocked_achievements: string[] = [];
  if (completed_sessions_count >= 1) unlocked_achievements.push("first_focus");
  if (checkins.length >= 1) unlocked_achievements.push("first_checkin");
  if (activeDays.has(1)) unlocked_achievements.push("day_one_master");
  if (current_streak >= 3) unlocked_achievements.push("streak_3");
  if (current_streak >= 7) unlocked_achievements.push("streak_7");
  if (total_focus_min >= 100) unlocked_achievements.push("century_focus");
  if (total_focus_min >= 500) unlocked_achievements.push("deep_work_master");
  if (completed_tasks_count >= 10) unlocked_achievements.push("task_dynamo");

  return {
    total_xp,
    level,
    current_streak,
    longest_streak: Math.max(current_streak, activeDays.size),
    total_focus_min,
    completed_sessions_count,
    completed_tasks_count,
    unlocked_achievements,
  };
}
