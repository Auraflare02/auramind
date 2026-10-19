import { Ctx, Plan, Day, Block } from "./schemas";
import { formatLevel } from "./categories";

export const PHASES = [
  "Foundation & Prerequisites",
  "Deliberate Practice & Skill Deepening",
  "Real-World Application & Project Work",
  "Error Diagnostics & Repair",
  "Consolidation & Milestone Checkpoint",
];

export const phaseOf = (d: number): string =>
  d <= 7 ? PHASES[0] : d <= 15 ? PHASES[1] : d <= 22 ? PHASES[2] : d <= 27 ? PHASES[3] : PHASES[4];

const START_TIMES: Record<string, number> = {
  morning: 7 * 60, // 07:00
  afternoon: 13 * 60 + 30, // 13:30
  evening: 18 * 60, // 18:00
  night: 20 * 60 + 30, // 20:30
};

const hm = (minutes: number): string => {
  const norm = ((minutes % 1440) + 1440) % 1440;
  const h = String(Math.floor(norm / 60)).padStart(2, "0");
  const m = String(norm % 60).padStart(2, "0");
  return `${h}:${m}`;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

const getDayName = (date: Date): string => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

export function fallbackPlan(c: Ctx, startDate?: Date): Plan {
  const baseDate = startDate ? new Date(startDate) : new Date(Date.now() + 864e5);
  const curLevelStr = formatLevel(c.category, c.current_level, c.custom_current_level);
  const tgtLevelStr = formatLevel(c.category, c.target_level, c.custom_target_level);

  const days: Day[] = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    const dayDate = new Date(baseDate.getTime() + (d - 1) * 864e5);
    const dayLabel = `Day ${d} (${getDayName(dayDate)})`;
    const calendarDate = formatDate(dayDate);
    const phase = phaseOf(d);
    const isLightDay = d % 7 === 0;

    // Daily study time in minutes
    const targetMins = Math.round((isLightDay ? Math.max(0.5, c.hours * 0.5) : c.hours) * 60);
    // Determine number of blocks (1 to 4)
    const blockCount = Math.max(1, Math.min(4, Math.round(targetMins / 45)));
    const blockDuration = Math.min(60, Math.max(25, Math.floor(targetMins / blockCount)));

    let currentStart = START_TIMES[c.focus] || START_TIMES.morning;
    const blocks: Block[] = [];

    for (let k = 0; k < blockCount; k++) {
      const startStr = hm(currentStart);
      const endStr = hm(currentStart + blockDuration);

      let activity = "";
      let category: Block["category"] = "practice";
      let priority: Block["priority"] = k === 0 ? "high" : "medium";
      let reason = "";

      if (isLightDay) {
        if (k === 0) {
          activity = `Weekly Consolidation & Review: ${c.goal}`;
          category = "review";
          priority = "medium";
          reason = "Lighter pace protects stamina and reinforces memory consolidation.";
        } else {
          activity = `Low-stress practice and planning next week`;
          category = "checkpoint";
          priority = "low";
          reason = "Assess weekly takeaways without cognitive overload.";
        }
      } else {
        if (d <= 7) {
          // Foundation
          if (k === 0) {
            activity = `Core Principles & Concept Study: ${c.goal} (${curLevelStr} → ${tgtLevelStr})`;
            category = "learn";
            priority = "high";
            reason = "Hardest cognitive intake scheduled during your peak focus window.";
          } else if (k === 1) {
            activity = `Guided drills and deliberate exercises`;
            category = "practice";
            priority = "medium";
            reason = "Immediate practice reinforces freshly learned neural connections.";
          } else {
            activity = `Self-quiz and summary in your own words`;
            category = "review";
            priority = "low";
            reason = "Active retrieval proves whether concepts actually stuck.";
          }
        } else if (d <= 15) {
          // Deliberate practice
          if (k === 0) {
            activity = `High-difficulty problem set / deliberate execution`;
            category = "practice";
            priority = "high";
            reason = "Targeting edge cases at the boundary of your current ability.";
          } else if (k === 1) {
            activity = `Error breakdown and solution study`;
            category = "repair";
            priority = "medium";
            reason = "Analyzing why mistakes occurred turns errors into permanent progress.";
          } else {
            activity = `Speed & fluency repetition`;
            category = "practice";
            priority = "low";
            reason = "Building automaticity on foundational mechanics.";
          }
        } else if (d <= 22) {
          // Application
          if (k === 0) {
            activity = `Realistic project work / full scenario test`;
            category = "practice";
            priority = "high";
            reason = "Synthetic tasks must transition to realistic complex problems.";
          } else if (k === 1) {
            activity = `Debugging and constraint handling`;
            category = "repair";
            priority = "medium";
            reason = "Fixing gaps revealed by real-world friction.";
          } else {
            activity = `Documentation / reflective logging`;
            category = "review";
            priority = "low";
            reason = "Codifying what was learned into durable reference notes.";
          }
        } else if (d <= 27) {
          // Error Repair
          if (k === 0) {
            activity = `Weak-point targeted remediation drill`;
            category = "repair";
            priority = "high";
            reason = "Directly targeting the lowest-performing sub-skills from check-ins.";
          } else if (k === 1) {
            activity = `Retesting previously failed exercises`;
            category = "practice";
            priority = "medium";
            reason = "Verification that previous bottlenecks are completely cleared.";
          } else {
            activity = `Confidence booster & fluency run`;
            category = "review";
            priority = "low";
            reason = "Rebuilding speed and positive momentum.";
          }
        } else {
          // Consolidation
          if (k === 0) {
            activity = `Full Mock Milestone Simulation / Final Assessment`;
            category = "checkpoint";
            priority = "high";
            reason = "Objective benchmark measuring delta from ${curLevelStr} toward ${tgtLevelStr}.";
          } else if (k === 1) {
            activity = `Comprehensive review and gap audit`;
            category = "repair";
            priority = "medium";
            reason = "Finalizing remaining uncertainties.";
          } else {
            activity = `Long-term maintenance strategy & roadmap`;
            category = "review";
            priority = "low";
            reason = "Establishing habits to maintain gains beyond the 30-day program.";
          }
        }
      }

      blocks.push({
        start: startStr,
        end: endStr,
        activity,
        category,
        priority,
        reason,
      });

      // 10-minute rest buffer between blocks
      currentStart += blockDuration + 10;
    }

    return {
      day: d,
      day_label: dayLabel,
      calendar_date: calendarDate,
      phase,
      blocks,
    };
  });

  return {
    goal_summary: `Structured 30-day roadmap targeting progression from ${curLevelStr} to ${tgtLevelStr} in ${c.goal}. Built with realistic pacing of ${c.hours}h daily in your ${c.focus} focus window.`,
    definition_of_success: `Consistent completion of daily deliberate practice blocks, measured diagnostic feedback on errors, and clear readiness at the ${tgtLevelStr} benchmark.`,
    weekly_focus: [
      {
        week: 1,
        title: "Foundation & Habit Architecture",
        focus: "Establish core terminology, diagnostic baseline, and steady execution cadence.",
        expected_outcome: "Zero missed setup steps and rock-solid foundational fluency.",
      },
      {
        week: 2,
        title: "Deliberate Practice & Edge Cases",
        focus: "Tackle harder problem sets at the edge of current ability.",
        expected_outcome: "Rapid error detection and elimination of recurring rookie mistakes.",
      },
      {
        week: 3,
        title: "Real-World Application",
        focus: "Apply learned sub-skills to authentic, unprompted scenarios or projects.",
        expected_outcome: "Independent problem solving without relying on step-by-step guides.",
      },
      {
        week: 4,
        title: "Error Repair & Mock Milestone",
        focus: "Simulated exam/project under realistic pressure conditions and final consolidation.",
        expected_outcome: "Demonstrated competence reaching the target benchmark level.",
      },
    ],
    risk_notes: [
      `Avoid cramming: research indicates 30-day consistency beats marathon 6-hour weekend sessions.`,
      c.distractions ? `Proactively guard against identified distractions: ${c.distractions}.` : `Protect your designated focus window from incoming notifications.`,
      c.fixed ? `Schedule is adjusted around your commitments: ${c.fixed}.` : `Keep scheduled study blocks at the same time each day to build an automatic habit.`,
    ],
    milestones: [
      { day: 7, milestone: "Foundation Diagnostic: 80%+ accuracy on core fundamentals." },
      { day: 14, milestone: "Deliberate Practice Milestone: Successfully solve 3 complex challenge problems." },
      { day: 21, milestone: "Application Milestone: First standalone mini-project or mock section complete." },
      { day: 30, milestone: "Final Milestone Evaluation: Complete end-to-end benchmark assessment." },
    ],
    relevant_research_findings: [
      "Spaced repetition and deliberate practice produce up to 2.5x higher retention than passive reading.",
      "Hourly check-ins and reflection turn missed tasks into diagnostic signals instead of demoralizing failures.",
      "Protecting 1 light day per 7 days prevents burnout and boosts long-term habit adherence.",
    ],
    days,
  };
}
