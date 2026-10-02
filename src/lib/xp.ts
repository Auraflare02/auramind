import type { HourLog } from "./types";

export type XpResult = {
  earned: number;
  breakdown: { label: string; points: number }[];
};

export function calculateXp(log: HourLog): XpResult {
  const breakdown: { label: string; points: number }[] = [];
  breakdown.push({ label: "Honest check-in", points: 20 });

  if (log.outcome === "completed") breakdown.push({ label: "Completed planned block", points: 30 });
  if (log.outcome === "partial") breakdown.push({ label: "Partial progress", points: 18 });
  if (log.outcome === "different") breakdown.push({ label: "Reported what actually happened", points: 10 });
  if (log.outcome === "skipped") breakdown.push({ label: "Logged a skipped block", points: 5 });

  const focusBonus = Math.min(25, Math.round(Math.max(0, Number(log.focusedMinutes || 0)) / 3));
  if (focusBonus) breakdown.push({ label: "Focused minutes", points: focusBonus });

  if (Number(log.distractionMinutes || 0) > 0 && String(log.distractionReason || "").trim()) {
    breakdown.push({ label: "Identified the blocker", points: 12 });
  }

  const recovered =
    Number(log.distractionMinutes || 0) > 0 &&
    Number(log.focusedMinutes || 0) >= 25 &&
    log.outcome !== "skipped";

  if (recovered) breakdown.push({ label: "Recovered after distraction", points: 15 });

  return {
    earned: breakdown.reduce((sum, item) => sum + item.points, 0),
    breakdown
  };
}
