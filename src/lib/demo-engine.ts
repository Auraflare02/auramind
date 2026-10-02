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

type Commitment = {
  label: string;
  start: number;
  end: number;
};

type TimeWindow = {
  start: number;
  end: number;
};

const MIN_FOCUS = 25;
const MAX_FOCUS = 55;
const BREAK_MIN = 10;

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function isoDate(date: Date, timezone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return map.year + "-" + map.month + "-" + map.day;
}

function todayInTimezone(timezone: string) {
  const now = new Date();
  const date = isoDate(now, timezone);
  return new Date(date + "T00:00:00");
}

function dayName(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    weekday: "long"
  }).format(date);
}

function parseClock(value: string) {
  const match = value.trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const suffix = (match[3] || "").toUpperCase();
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  if (!suffix && hour <= 24) return hour * 60 + minutes;
  return hour >= 0 && hour <= 23 ? hour * 60 + minutes : null;
}

function formatTime(totalMinutes: number) {
  const safe = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(safe / 60);
  const minutes = safe % 60;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return displayHour + ":" + String(minutes).padStart(2, "0") + " " + suffix;
}

function parseCommitments(text: string): Commitment[] {
  return text
    .split(/\n|,/)
    .map((line) => {
      const match = line.match(
        /^\s*(.*?)\s*:\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*$/i
      );
      if (!match) return null;
      const start = parseClock(match[2]);
      const end = parseClock(match[3]);
      if (start === null || end === null || end <= start) return null;
      return { label: match[1] || "Fixed commitment", start, end };
    })
    .filter((item): item is Commitment => Boolean(item));
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && aEnd > bStart;
}

function subtractBusy(windows: TimeWindow[], busy: Commitment[]) {
  let result = [...windows];
  for (const commitment of busy) {
    const next: TimeWindow[] = [];
    for (const window of result) {
      if (!overlaps(window.start, window.end, commitment.start, commitment.end)) {
        next.push(window);
        continue;
      }
      if (window.start < commitment.start) {
        next.push({ start: window.start, end: commitment.start });
      }
      if (commitment.end < window.end) {
        next.push({ start: commitment.end, end: window.end });
      }
    }
    result = next;
  }
  return result.filter((window) => window.end - window.start >= MIN_FOCUS);
}

function inferSleep(commitments: Commitment[]) {
  const sleep = commitments.find((item) => /sleep|bed|rest/i.test(item.label));
  if (sleep) return { wake: sleep.end, bed: sleep.start };
  return { wake: 6 * 60 + 30, bed: 23 * 60 };
}

function inferDomain(input: PlanInput) {
  const text = (input.goal + " " + input.currentLevel + " " + input.targetLevel).toLowerCase();
  if (/board|class 10|cbse|school exam|half yearly|marks|percentage/.test(text)) return "study";
  if (/code|coding|software|developer|programming|app|website|ai|data/.test(text)) return "coding";
  if (/german|deutsch|language|b2|a2|goethe/.test(text)) return "language";
  if (/fitness|gym|strength|muscle|run|treadmill|exercise/.test(text)) return "fitness";
  return "general";
}

function subjectFromText(input: PlanInput) {
  const text = (input.goal + " " + input.currentLevel).toLowerCase();
  if (/math|algebra|geometry|statistic|trigonometry/.test(text)) return "Maths";
  if (/science|physics|chemistry|biology/.test(text)) return "Science";
  if (/english|grammar|writing|literature/.test(text)) return "English";
  if (/sst|social science|history|geography|civics|economics/.test(text)) return "Social Science";
  return "the main weak area";
}

function daysUntil(deadline: string, timezone: string) {
  const now = todayInTimezone(timezone).getTime();
  const target = new Date(deadline + "T00:00:00").getTime();
  return Math.ceil((target - now) / 86400000);
}

function getTaskTemplates(input: PlanInput) {
  const domain = inferDomain(input);
  const subject = subjectFromText(input);

  if (domain === "study") {
    return [
      { activity: `Foundation repair: ${subject} — learn one concept and make a 1-page recall sheet`, category: "Foundation" },
      { activity: `Guided practice: ${subject} — solve 8–12 questions and mark every doubt`, category: "Practice" },
      { activity: `Mistake repair: ${subject} — redo yesterday's errors without looking at answers`, category: "Error repair" },
      { activity: `Active recall: ${subject} — explain the topic aloud, then test yourself from memory`, category: "Recall" },
      { activity: `Mixed practice: ${subject} — timed set followed by correction and error notes`, category: "Timed practice" },
      { activity: `Weak-area repair: ${subject} — choose the hardest remaining concept and break it into 3 micro-tasks`, category: "Weak area" },
      { activity: "Weekly checkpoint — 30-minute mini-test, score it, and write next week's top 3 fixes", category: "Review" }
    ];
  }

  if (domain === "coding") {
    return [
      { activity: "Foundation: learn one core concept and write a tiny example from memory", category: "Foundation" },
      { activity: "Build: implement one small feature without copying a full solution", category: "Build" },
      { activity: "Debug: review yesterday's code, find 2 issues, and fix them", category: "Debugging" },
      { activity: "Practice: solve 2–3 focused problems using the week's concept", category: "Practice" },
      { activity: "Build: extend the project with one user-visible improvement", category: "Build" },
      { activity: "Review: explain your code structure and rewrite one weak section cleanly", category: "Review" },
      { activity: "Weekly checkpoint — demo what you built and write the next 3 concrete tasks", category: "Checkpoint" }
    ];
  }

  if (domain === "language") {
    return [
      { activity: "Input: learn 15–20 useful words/phrases and use each in a sentence", category: "Vocabulary" },
      { activity: "Grammar: one focused grammar topic + 15 correction exercises", category: "Grammar" },
      { activity: "Listening: 20–30 minutes of comprehensible audio + written summary", category: "Listening" },
      { activity: "Speaking: record a 3–5 minute response and note missing words", category: "Speaking" },
      { activity: "Reading: one short text + highlight unknown vocabulary + retell it", category: "Reading" },
      { activity: "Writing: one timed paragraph/message + self-correction", category: "Writing" },
      { activity: "Weekly checkpoint — mixed mini-test and a list of the 5 most repeated mistakes", category: "Checkpoint" }
    ];
  }

  if (domain === "fitness") {
    return [
      { activity: "Session: technique-focused workout + easy conditioning", category: "Training" },
      { activity: "Session: strength-focused workout with controlled sets and recovery", category: "Training" },
      { activity: "Recovery: mobility, easy walk and review how the body felt", category: "Recovery" },
      { activity: "Session: full-body workout with simple progress tracking", category: "Training" },
      { activity: "Conditioning: easy treadmill/cardio work + recovery", category: "Conditioning" },
      { activity: "Technique review: record what felt easy/hard and adjust next session", category: "Review" },
      { activity: "Weekly checkpoint — review consistency, recovery and next week's training load", category: "Checkpoint" }
    ];
  }

  return [
    { activity: "Foundation: define the next concrete result and complete one focused work block", category: "Foundation" },
    { activity: "Execution: complete the highest-value task for the goal", category: "Execution" },
    { activity: "Review: inspect yesterday's work and fix one weak point", category: "Review" },
    { activity: "Practice: do one deliberate-practice block on the hardest skill", category: "Practice" },
    { activity: "Execution: produce one visible output that moves the goal forward", category: "Execution" },
    { activity: "Weak-area repair: isolate the biggest blocker and split it into smaller steps", category: "Weak area" },
    { activity: "Weekly checkpoint — review evidence, identify the main bottleneck and define next week's priorities", category: "Checkpoint" }
  ];
}

function priorityFor(index: number, blockIndex: number, daysLeft: number): Priority {
  if (index === 6) return "high";
  if (daysLeft > 0 && daysLeft <= 14) return blockIndex === 0 ? "high" : "medium";
  return blockIndex === 0 ? "high" : blockIndex === 1 ? "medium" : "low";
}

function allocateSessions(
  windows: TimeWindow[],
  minutesNeeded: number,
  template: { activity: string; category: string },
  priority: Priority,
  dayIndex: number
) {
  const blocks: AuraPlan["schedule"][number]["blocks"] = [];
  let remaining = minutesNeeded;

  // Prefer two separated sessions so the plan is not one giant block.
  const preferredChunk = remaining > 90 ? 45 : remaining > 55 ? 40 : 30;

  for (const window of windows) {
    if (remaining <= 0) break;
    let cursor = window.start;

    while (cursor + MIN_FOCUS <= window.end && remaining > 0) {
      const gap = window.end - cursor;
      const chunk = Math.min(remaining, preferredChunk, MAX_FOCUS, gap);

      if (chunk < MIN_FOCUS) break;

      const variation =
        dayIndex === 6
          ? " Finish with a short review of what you learned."
          : dayIndex % 2 === 0
            ? " End by writing the next action before stopping."
            : " End by recording one mistake, doubt or lesson.";

      blocks.push({
        start: formatTime(cursor),
        end: formatTime(cursor + chunk),
        activity: template.activity + variation,
        category: template.category,
        priority,
        reason: "Scheduled inside your actual free window and split into a trackable focus block."
      });

      remaining -= chunk;
      cursor += chunk;

      if (remaining > 0 && cursor + BREAK_MIN <= window.end) {
        cursor += BREAK_MIN;
      }
    }
  }

  return blocks;
}

export function makeDemoPlan(input: PlanInput): AuraPlan {
  const dailyHours = Math.max(1, Math.min(6, Number.isFinite(input.dailyHours) ? input.dailyHours : 3));
  const commitments = parseCommitments(input.fixedSchedule);
  const sleep = inferSleep(commitments);
  const templates = getTaskTemplates(input);
  const daysLeft = daysUntil(input.deadline, input.timezone);
  const today = todayInTimezone(input.timezone);

  const schedule = Array.from({ length: 7 }, (_, index) => {
    const current = addDays(today, index);
    const weekday = current.getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    const baseWindows = [
      { start: sleep.wake + 30, end: 10 * 60 + 30 },
      { start: 12 * 60 + 30, end: 15 * 60 + 30 },
      { start: 18 * 60 + 15, end: sleep.bed - 30 }
    ];

    const available = subtractBusy(baseWindows, commitments);
    const targetMinutes = dailyHours * 60;

    // Keep a small buffer rather than stuffing the full stated availability every day.
    const usableMinutes = Math.round(targetMinutes * (isWeekend ? 0.95 : 0.85));
    const windows = available
      .sort((a, b) => (b.end - b.start) - (a.end - a.start))
      .map((window) => ({ ...window }));

    const blocks = allocateSessions(
      windows,
      usableMinutes,
      templates[index],
      priorityFor(index, 0, daysLeft),
      index
    );

    // Re-sort chronologically because windows were used by size.
    blocks.sort((a, b) => (parseClock(a.start) ?? 0) - (parseClock(b.start) ?? 0));

    return {
      day: dayName(current, input.timezone),
      date: isoDate(current, input.timezone),
      blocks
    };
  });

  const domain = inferDomain(input);
  const urgency =
    daysLeft <= 7
      ? "Deadline is close, so this week emphasizes practice and review."
      : daysLeft <= 30
        ? "The deadline is approaching, so the plan gradually shifts from learning to practice."
        : "The first week prioritizes consistency and foundation before increasing difficulty.";

  return {
    goal_summary: input.goal,
    success_definition:
      "A successful week means the user completes the planned focus blocks, logs what actually happened, and leaves evidence that the next week can be adjusted.",
    weekly_focus:
      urgency +
      " Goal type: " +
      domain +
      ". Current level: " +
      input.currentLevel +
      ". Target: " +
      input.targetLevel +
      ".",
    risk_notes: [
      "The plan deliberately leaves buffer around fixed commitments instead of filling every free minute.",
      "A skipped block is treated as behavioral data; repeated patterns should trigger schedule changes.",
      "Task difficulty should increase only after the user demonstrates consistent completion."
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

function timeBucket(hourStart: string) {
  const minutes = parseClock(hourStart);
  if (minutes === null) return "Unknown";
  const hour = Math.floor(minutes / 60);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function averageFocus(logs: HourLog[]) {
  if (!logs.length) return 0;
  return logs.reduce((sum, log) => sum + safeNumber(log.focusedMinutes), 0) / logs.length;
}

function strongestWeakest(logs: HourLog[]) {
  const grouped = new Map<string, { focus: number; entries: number }>();
  for (const log of logs) {
    const key = timeBucket(log.hourStart);
    const current = grouped.get(key) || { focus: 0, entries: 0 };
    current.focus += safeNumber(log.focusedMinutes);
    current.entries += 1;
    grouped.set(key, current);
  }

  const entries = [...grouped.entries()]
    .map(([key, value]) => [key, value.entries ? value.focus / value.entries : 0] as const)
    .sort((a, b) => b[1] - a[1]);

  return {
    strongest: entries[0]?.[0] || "Not enough data",
    weakest: entries.length ? entries[entries.length - 1][0] : "Not enough data"
  };
}

function topLabels(logs: HourLog[], key: "distractionCategory" | "distractionReason", limit: number) {
  const counts = new Map<string, number>();
  logs.forEach((log) => {
    const value = String(log[key] || "").trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => name);
}

export function makeDemoDailyReport(date: string, logs: HourLog[]): DailyReport {
  const planned = plannedMinutes(logs);
  const focused = logs.reduce((sum, log) => sum + safeNumber(log.focusedMinutes), 0);
  const distracted = logs.reduce((sum, log) => sum + safeNumber(log.distractionMinutes), 0);
  const percent = planned ? Math.min(100, Math.round((focused / planned) * 1000) / 10) : 0;
  const { strongest, weakest } = strongestWeakest(logs);
  const distractions = topLabels(logs, "distractionCategory", 3);
  const reasons = topLabels(logs, "distractionReason", 2);
  const dominantReason = reasons[0];

  let keyProblem = "Not enough completed check-ins to identify a reliable issue.";
  let solution = "Log the next few hours consistently before changing the schedule.";

  if (dominantReason === "Task was too difficult" || dominantReason === "Did not understand") {
    keyProblem = "Difficulty/understanding appears to be the main blocker today.";
    solution = "Shrink the next task to one concept or 5–10 questions, then record the exact point that remains unclear.";
  } else if (dominantReason === "Tired") {
    keyProblem = "Fatigue appears to be reducing focus in the logged periods.";
    solution = "Move the hardest block toward the strongest period (" + strongest + ") and use a lighter review task later.";
  } else if (dominantReason) {
    keyProblem = "The repeated self-reported reason today was " + dominantReason + ".";
    solution = "Add one barrier against the trigger before the next focus block and compare the result tomorrow.";
  } else if (distractions.length) {
    keyProblem = "The main logged distraction today was " + distractions[0] + ".";
    solution = "Use one protected focus block with " + distractions[0] + " unavailable, then compare focused minutes.";
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
    aiSummary:
      "Core analysis used your self-reported hourly data. Average focus per logged hour: " +
      Math.round(averageFocus(logs) * 10) / 10 +
      " minutes. This mode does not pretend to be a large language model; it uses transparent rules until paid AI is enabled."
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

  const periodFocus = new Map<string, { focus: number; days: Set<string> }>();
  const distractions = new Map<string, number>();
  const reasons = new Map<string, Set<string>>();

  weekLogs.forEach((log) => {
    const bucket = timeBucket(log.hourStart);
    const current = periodFocus.get(bucket) || { focus: 0, days: new Set<string>() };
    current.focus += safeNumber(log.focusedMinutes);
    current.days.add(log.date);
    periodFocus.set(bucket, current);

    if (log.distractionCategory) {
      distractions.set(
        log.distractionCategory,
        (distractions.get(log.distractionCategory) || 0) + safeNumber(log.distractionMinutes)
      );
    }

    if (log.distractionReason) {
      const days = reasons.get(log.distractionReason) || new Set<string>();
      days.add(log.date);
      reasons.set(log.distractionReason, days);
    }
  });

  const periods = [...periodFocus.entries()]
    .map(([name, data]) => ({
      name,
      score: data.days.size ? data.focus / data.days.size : 0,
      days: data.days.size
    }))
    .sort((a, b) => b.score - a.score);

  const topDistractions = [...distractions.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const recurringReasons = [...reasons.entries()]
    .filter(([, days]) => days.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 3)
    .map(([name]) => name);

  const patterns: string[] = [];
  if (periods.length >= 2) {
    patterns.push(periods[0].name + " produced the highest average focused minutes across logged days.");
    patterns.push(periods[periods.length - 1].name + " produced the lowest average focus across logged days.");
  }
  if (recurringReasons.length) {
    patterns.push("Repeated blocker across multiple days: " + recurringReasons[0] + ".");
  }
  if (topDistractions.length) {
    patterns.push("Most costly logged distraction: " + topDistractions[0] + ".");
  }

  const recommendations: string[] = [];
  if (periods[0]) recommendations.push("Reserve " + periods[0].name + " for the hardest work.");
  if (periods.length >= 2) recommendations.push("Move lighter review into " + periods[periods.length - 1].name + ".");
  if (recurringReasons[0]) recommendations.push("Design the next plan around the recurring blocker: " + recurringReasons[0] + ".");
  if (topDistractions[0]) recommendations.push("Add a specific barrier against " + topDistractions[0] + " during focus blocks.");
  if (!recommendations.length) recommendations.push("Collect at least 2–3 days of hourly data before making a major schedule change.");

  return {
    weekStart,
    weekEnd,
    completionPercent: percent,
    focusedMinutes: focused,
    distractionMinutes: distracted,
    bestPeriod: periods[0]?.name || "Not enough data",
    worstPeriod: periods.length ? periods[periods.length - 1].name : "Not enough data",
    topDistractions,
    recurringReasons,
    patterns,
    recommendations,
    aiSummary:
      "Core weekly analysis only promotes repeated signals supported by multiple entries/days. It does not treat one missed task as proof of a character flaw."
  };
}
