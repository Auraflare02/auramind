export function cleanString(value: unknown, max = 4000) {
  return String(value ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

export function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(value + "T00:00:00Z").getTime());
}

export function dateAdd(date: string, days: number) {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function validateSchedule(schedule: unknown, expectedLength: number) {
  if (!Array.isArray(schedule) || schedule.length !== expectedLength) return false;

  const seen = new Set<string>();
  for (const [index, raw] of schedule.entries()) {
    const day = raw as { date?: unknown; blocks?: unknown };
    if (!isIsoDate(day?.date) || seen.has(day.date)) return false;

    if (index > 0) {
      const previous = schedule[index - 1] as { date?: string };
      if (!previous?.date || dateAdd(previous.date, 1) !== day.date) return false;
    }

    seen.add(day.date);
    if (!Array.isArray(day.blocks)) return false;

    for (const rawBlock of day.blocks) {
      const block = rawBlock as {
        start?: unknown; end?: unknown; activity?: unknown;
        category?: unknown; priority?: unknown; reason?: unknown;
      };

      if (
        !cleanString(block.start, 30) ||
        !cleanString(block.end, 30) ||
        !cleanString(block.activity, 800) ||
        !cleanString(block.category, 120) ||
        !["high", "medium", "low"].includes(String(block.priority)) ||
        !cleanString(block.reason, 800)
      ) return false;
    }
  }

  return true;
}

export function validateHourLog(value: unknown) {
  const log = value as Record<string, unknown> | null;
  if (!log || !isIsoDate(log.date)) return false;

  const focused = clampNumber(log.focusedMinutes, 0, 60, -1);
  const distracted = clampNumber(log.distractionMinutes, 0, 60, -1);

  return focused >= 0 &&
    distracted >= 0 &&
    ["completed", "partial", "skipped", "different"].includes(String(log.outcome));
}
