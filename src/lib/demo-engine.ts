import type { AuraPlan, DailyReport, HourLog, WeeklyReport, Priority } from "./types";

type PlanInput = {
  goal: string;
  deadline: string;
  currentLevel: string;
  targetLevel: string;
  fixedSchedule: string;
  dailyHours: number;
  timezone: string;
};

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function isoDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

function dayName(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long"
  }).format(date);
}

function parseHour(value: string) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const suffix = match[3].toUpperCase();
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return hour * 60 + minutes;
}

function formatTime(totalMinutes: number) {
  const safe = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(safe / 60);
  const minutes = safe % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return displayHour + ":" + String(minutes).padStart(2, "0") + " " + suffix;
}

function fixedRanges(text: string) {
  return text
    .split(/\n|,/)
    .map((line) => {
      const values = line.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
      if (!values) return null;
      const start = parseHour(values[1]);
      const end = parseHour(values[2]);
      return start !== null && end !== null ? { start, end } : null;
    })
    .filter((item): item is { start: number; end: number } => Boolean(item));
}

function overlaps(start: number, end: number, range: { start: number; end: number }) {
  return start < range.end && end > range.start;
}

function clampHours(hours: number) {
  return Math.max(1, Math.min(6, Number.isFinite(hours) ? hours : 3));
}

export function makeDemoPlan(input: PlanInput): AuraPlan {
  const dailyHours = clampHours(input.dailyHours);
  const commitmentRanges = fixedRanges(input.fixedSchedule);
  const today = new Date();

  const focusTemplates = [
    "Core work: learn one small concept and write a short summary",
    "Core work: practice the most important task for the goal",
    "Core work: targeted practice + review mistakes",
    "Core work: active recall / hands-on practice",
    "Core work: timed practice and error correction",
    "Core work: weak-area repair",
    "Weekly review: test yourself and plan the next week"
  ];

  const schedule = Array.from({ length: 7 }, (_, index) => {
    const current = addDays(today, index);
    const blocks: AuraPlan["schedule"][number]["blocks"] = [];
    let remaining = dailyHours * 60;

    // Start with a practical evening window that avoids common fixed commitments.
    const candidates = [
      { start: 18 * 60 + 15, end: 18 * 60 + 45 },
      { start: 19 * 60, end: 19 * 60 + 45 },
      { start: 20 * 60, end: 20 * 60 + 45 },
      { start: 21 * 60, end: 21 * 60 + 30 }
    ];

    for (let i = 0; i < candidates.length && remaining > 0; i++) {
      const candidate = candidates[i];
      if (commitmentRanges.some((range) => overlaps(candidate.start, candidate.end, range))) continue;

      const minutes = Math.min(remaining, candidate.end - candidate.start);
      if (minutes < 25) continue;

      const priority: Priority = index === 0 || i === 0 ? "high" : i === 1 ? "medium" : "low";
      blocks.push({
        start: formatTime(candidate.start),
        end: formatTime(candidate.start + minutes),
        activity: focusTemplates[index],
        category: index === 6 ? "Review" : "Goal work",
        priority,
        reason: "Small, trackable block sized around your stated daily availability."
      });

      remaining -= minutes;

      if (remaining > 0 && i < candidates.length - 1) {
        const breakStart = candidate.start + minutes;
        const breakEnd = Math.min(breakStart + 15, candidates[i + 1].start);
        if (breakEnd > breakStart) {
          blocks.push({
            start: formatTime(breakStart),
            end: formatTime(breakEnd),
            activity: "Break / reset",
            category: "Recovery",
            priority: "low",
            reason: "Short reset to make the next focus block easier to start."
          });
        }
      }
    }

    return {
      day: dayName(current),
      date: isoDate(current),
      blocks
    };
  });

  return {
    goal_summary: input.goal,
    success_definition: "Complete the planned blocks consistently, record what actually happened, and use the data to adjust the next week.",
    weekly_focus: "Build consistency first; use short focused sessions and protect time around your fixed commitments.",
    risk_notes: [
      "This is a demo planning engine because the OpenAI API is unavailable or out of credits.",
      "A missed block is treated as data to learn from, not as a character judgement.",
      "The next plan should be changed from repeated evidence, not from one bad hour."
    ],
    schedule,
    engine: "demo"
  };
}

function plannedMinutes(logs: HourLog[]) {
  return logs.reduce((sum, log) => {
    const activity = log.plannedActivity || "";
    return sum + (activity && !/break|free time|unplanned/i.test(activity) ? 60 : 0);
  }, 0);
}

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function strongestWeakest(logs: HourLog[]) {
  const grouped = new Map<string, { focus: number; count: number }>();
  for (const log of logs) {
    const current = grouped.get(log.hourStart) || { focus: 0, count: 0 };
    current.focus += safeNumber(log.focusedMinutes);
    current.count += 1;
    grouped.set(log.hourStart, current);
  }
  const entries = [...grouped.entries()]
    .filter(([, value]) => value.count > 0)
    .sort((a, b) => b[1].focus - a[1].focus);
  return {
    strongest: entries[0]?.[0] || "Not enough data",
    weakest: entries.length ? entries[entries.length - 1][0] : "Not enough data"
  };
}

function topLabel(logs: HourLog[], key: "distractionCategory" | "distractionReason") {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const value = String(log[key] || "").trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

export function makeDemoDailyReport(date: string, logs: HourLog[]): DailyReport {
  const planned = plannedMinutes(logs);
  const focused = logs.reduce((sum, log) => sum + safeNumber(log.focusedMinutes), 0);
  const distracted = logs.reduce((sum, log) => sum + safeNumber(log.distractionMinutes), 0);
  const percent = planned ? Math.min(100, Math.round((focused / planned) * 1000) / 10) : 0;
  const { strongest, weakest } = strongestWeakest(logs);
  const distraction = topLabel(logs, "distractionCategory");
  const reason = topLabel(logs, "distractionReason");

  let keyProblem = "Not enough completed check-ins to identify a clear issue.";
  let solution = "Log the next few hours consistently before changing the schedule.";

  if (reason) {
    keyProblem = "The most common self-reported reason today was " + reason + (distraction ? ", often alongside " + distraction + "." : ".");
    solution = reason === "Task was too difficult" || reason === "Did not understand"
      ? "Break the next task into a smaller step and write down the exact point you do not understand."
      : reason === "Tired"
        ? "Move the hardest block to an earlier high-focus period and keep the later block lighter."
        : "Reduce the trigger during the next focus block and make the first task small enough to start immediately.";
  } else if (distracted) {
    keyProblem = "The main distraction today was " + distracted + ".";
    solution = "Use one protected focus block with the distraction source out of reach, then review the result.";
  }

  return {
    date,
    completionPercent: percent,
    plannedMinutes: planned,
    focusedMinutes: focused,
    distractionMinutes: distracted,
    strongestPeriod: strongest,
    weakestPeriod: weakest,
    keyProblem,
    solution,
    aiSummary: "Demo analysis: the report is based only on the check-ins you entered today. More consistent data will make pattern detection more useful.",
  };
}

export function makeDemoWeeklyReport(anchorDate: string, logs: HourLog[]): WeeklyReport {
  const end = new Date(anchorDate + "T00:00:00");
  const start = addDays(end, -6);
  const weekStart = isoDate(start);
  const weekEnd = isoDate(end);
  const weekLogs = logs.filter((log) => log.date >= weekStart && log.date <= weekEnd);

  const planned = plannedMinutes(weekLogs);
  const focused = weekLogs.reduce((sum, log) => sum + safeNumber(log.focusedMinutes), 0);
  const distracted = weekLogs.reduce((sum, log) => sum + safeNumber(log.distractionMinutes), 0);
  const percent = planned ? Math.min(100, Math.round((focused / planned) * 1000) / 10) : 0;

  const byPeriod = new Map<string, number>();
  const distractions = new Map<string, number>();
  const reasons = new Map<string, number>();

  weekLogs.forEach((log) => {
    byPeriod.set(log.hourStart, (byPeriod.get(log.hourStart) || 0) + safeNumber(log.focusedMinutes));
    if (log.distractionCategory) distractions.set(log.distractionCategory, (distractions.get(log.distractionCategory) || 0) + safeNumber(log.distractionMinutes));
    if (log.distractionReason) reasons.set(log.distractionReason, (reasons.get(log.distractionReason) || 0) + 1);
  });

  const periods = [...byPeriod.entries()].sort((a, b) => b[1] - a[1]);
  const topDistractions = [...distractions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  const recurringReasons = [...reasons.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

  const patterns: string[] = [];
  if (periods.length >= 2) {
    patterns.push(periods[0][0] + " accumulated the most focused minutes.");
    patterns.push(periods[periods.length - 1][0] + " accumulated the least focused minutes.");
  }
  if (recurringReasons.length) patterns.push("Repeated reason: " + recurringReasons[0] + ".");
  if (topDistractions.length) patterns.push("Recurring distraction source: " + topDistractions[0] + ".");

  const recommendations: string[] = [];
  if (periods[0]) recommendations.push("Protect " + periods[0][0] + " for harder work.");
  if (periods.length >= 2) recommendations.push("Use " + periods[periods.length - 1][0] + " for lighter review or recovery.");
  if (topDistractions[0]) recommendations.push("Add a specific barrier against " + topDistractions[0] + " during focus blocks.");
  if (!recommendations.length) recommendations.push("Collect more hourly data before making major schedule changes.");

  return {
    weekStart,
    weekEnd,
    completionPercent: percent,
    focusedMinutes: focused,
    distractionMinutes: distracted,
    bestPeriod: periods[0]?.[0] || "Not enough data",
    worstPeriod: periods.length ? periods[periods.length - 1][0] : "Not enough data",
    topDistractions,
    recurringReasons,
    patterns,
    recommendations,
    aiSummary: "Demo weekly analysis: repeated patterns are only reported when the entered data supports them. No single missed task is treated as proof of laziness.",
  };
}
