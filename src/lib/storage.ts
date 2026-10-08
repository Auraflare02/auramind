import type { AuraPlan, HourLog, DailyReport, WeeklyReport } from "./types";

const PLAN_KEY = "auramind:plan";
const LOG_KEY = "auramind:hour-logs";
const DAILY_KEY = "auramind:daily-reports";
const WEEKLY_KEY = "auramind:weekly-reports";
const ACTIVE_KEY = "auramind:active-goal";
const XP_KEY = "auramind:xp";
const XP_EVENTS_KEY = "auramind:xp-events";
const SESSION_KEY = "auramind:session-token";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

export function getPlan() { return read<AuraPlan | null>(PLAN_KEY, null); }
export function savePlan(plan: AuraPlan) { write(PLAN_KEY, plan); }

export function getLogs() { return read<HourLog[]>(LOG_KEY, []); }
export function saveLog(log: HourLog) {
  const logs = getLogs().filter((item) => item.id !== log.id);
  logs.push(log);
  write(LOG_KEY, logs);
}
export function getLogsForDate(date: string) { return getLogs().filter((log) => log.date === date); }

export function saveDailyReport(report: DailyReport) {
  const reports = read<DailyReport[]>(DAILY_KEY, []).filter((item) => item.date !== report.date);
  reports.push(report);
  write(DAILY_KEY, reports);
}

export function saveWeeklyReport(report: WeeklyReport) {
  const reports = read<WeeklyReport[]>(WEEKLY_KEY, []).filter((item) => item.weekStart !== report.weekStart);
  reports.push(report);
  write(WEEKLY_KEY, reports);
}


export function isGoalActive() { return read<boolean>(ACTIVE_KEY, false); }
export function setGoalActive(active: boolean) { write(ACTIVE_KEY, active); }
export function getXp() { return read<number>(XP_KEY, 0); }
export function addXp(points: number) { const next = Math.max(0, getXp() + points); write(XP_KEY, next); return next; }

export function awardXpOnce(eventId: string, points: number) {
  const events = read<string[]>(XP_EVENTS_KEY, []);
  if (events.includes(eventId)) return { awarded: false, total: getXp() };
  events.push(eventId);
  write(XP_EVENTS_KEY, events);
  return { awarded: true, total: addXp(points) };
}

export function getSessionToken() { return read<string>(SESSION_KEY, ""); }
export function saveSessionToken(token: string) { write(SESSION_KEY, token); }
export function clearSessionToken() {
  if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
}
