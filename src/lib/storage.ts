import type { AuraPlan, HourLog, DailyReport, WeeklyReport } from "./types";

const PLAN_KEY = "auramind:plan";
const LOG_KEY = "auramind:hour-logs";
const DAILY_KEY = "auramind:daily-reports";
const WEEKLY_KEY = "auramind:weekly-reports";

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
