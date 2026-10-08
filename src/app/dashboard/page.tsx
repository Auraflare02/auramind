"use client";

import { useEffect, useMemo, useState } from "react";
import {
  awardXpOnce,
  getLogs,
  getLogsForDate,
  getPlan,
  getXp,
  getDailyReportForDate,
  getLatestWeeklyReport,
  getSessionToken,
  isGoalActive,
  saveDailyReport,
  saveLog,
  savePlan,
  saveSessionToken,
  saveWeeklyReport
} from "../../lib/storage";
import { calculateXp } from "../../lib/xp";
import type { AuraPlan, DailyReport, HourLog, WeeklyReport, AdaptivePlan } from "../../lib/types";

const hours = Array.from({ length: 17 }, (_, i) => i + 6);
const distractionTypes = ["Social media","YouTube","Gaming","Messaging","Web browsing","Sleep","Family/interruption","Boredom","Other"];
const reasons = ["Bored","Task was too difficult","Did not understand","Tired","Phone notification","Unexpected work","Lost focus","Environment","Other"];

function safeTimeZone(value?: string) {
  const candidate = value || "Asia/Kolkata";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return "Asia/Kolkata";
  }
}

function localDate(timezone = "Asia/Kolkata") {
  return new Intl.DateTimeFormat("en-CA", { timeZone: safeTimeZone(timezone) }).format(new Date());
}

function hourLabel(hour: number) {
  const h = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return h + ":00 " + suffix;
}

function timeToMinutes(value: string) {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;
  let h = Number(match[1]);
  const mins = Number(match[2] || 0);
  const mer = (match[3] || "").toUpperCase();
  if (mer === "PM" && h < 12) h += 12;
  if (mer === "AM" && h === 12) h = 0;
  return h * 60 + mins;
}

function plannedActivity(plan: AuraPlan | null, date: string, hour: number) {
  const day = plan?.schedule.find((d) => d.date === date);
  if (!day) return "Unplanned / free time";
  const start = hour * 60;
  const end = start + 60;
  const block = day.blocks.find((b) => {
    const s = timeToMinutes(b.start);
    const e = timeToMinutes(b.end);
    return s !== null && e !== null && s < end && e > start;
  });
  return block?.activity || "Break / personal time";
}

function newRow(plan: AuraPlan | null, date: string, hour: number): HourLog {
  return {
    id: date + "-" + hour,
    date,
    hourStart: hourLabel(hour),
    hourEnd: hourLabel(hour + 1),
    plannedActivity: plannedActivity(plan, date, hour),
    actualActivity: "",
    outcome: "completed",
    focusedMinutes: 0,
    distractionMinutes: 0,
    distractionCategory: "",
    distractionReason: "",
    notes: ""
  };
}

function fromServerLog(row: any): HourLog {
  return {
    id: String(row.id ?? (String(row.logged_for) + "-" + String(row.hour_start))),
    date: String(row.logged_for),
    hourStart: String(row.hour_start),
    hourEnd: String(row.hour_end),
    plannedActivity: String(row.planned_activity ?? ""),
    actualActivity: String(row.actual_activity ?? ""),
    outcome: ["completed", "partial", "skipped", "different"].includes(String(row.outcome))
      ? row.outcome
      : "different",
    focusedMinutes: Math.max(0, Math.min(60, Number(row.focused_minutes ?? 0))),
    distractionMinutes: Math.max(0, Math.min(60, Number(row.distraction_minutes ?? 0))),
    distractionCategory: String(row.distraction_category ?? ""),
    distractionReason: String(row.distraction_reason ?? ""),
    notes: String(row.notes ?? "")
  };
}

export default function Dashboard() {
  const [plan, setPlan] = useState<AuraPlan | null>(null);
  const [date, setDate] = useState(localDate());
  const [logs, setLogs] = useState<HourLog[]>([]);
  const [daily, setDaily] = useState<DailyReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [adaptive, setAdaptive] = useState<AdaptivePlan | null>(null);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [xp, setXp] = useState(0);
  const [active, setActive] = useState(false);
  const [promptRow, setPromptRow] = useState<HourLog | null>(null);
  const [assistantQuestion, setAssistantQuestion] = useState("");
  const [assistantReply, setAssistantReply] = useState<any>(null);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [sessionToken, setSessionToken] = useState("");

  useEffect(() => {
    const localPlan = getPlan();
    const localLogs = getLogsForDate(date);
    setPlan(localPlan);
    setLogs(localLogs);
    setXp(getXp());
    setActive(isGoalActive());
    setDaily(getDailyReportForDate(date));
    setWeekly(getLatestWeeklyReport());
    setSessionToken(getSessionToken());

    const token = getSessionToken();
    if (!token) return;

    let cancelled = false;

    fetch("/api/session", {
      headers: { "x-session-token": token },
      cache: "no-store"
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Session unavailable");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.plan) {
          savePlan(data.plan);
          setPlan(data.plan);
        }
        if (Array.isArray(data.logs)) {
          const mapped = data.logs.map(fromServerLog);
          const dayLogs = mapped.filter((item: HourLog) => item.date === date);
          setLogs(dayLogs);
        }
        if (Array.isArray(data.reports)) {
          const dailyReport = [...data.reports]
            .filter((item) => item.report_type === "daily" && item.report_key === date)
            .at(-1);
          if (dailyReport?.payload) {
            saveDailyReport(dailyReport.payload);
            setDaily(dailyReport.payload);
          }
          const weeklyReports = [...data.reports].filter((item) => item.report_type === "weekly");
          const weeklyReport = weeklyReports.at(-1);
          if (weeklyReport?.payload) {
            saveWeeklyReport(weeklyReport.payload);
            setWeekly(weeklyReport.payload);
          }
          const adaptiveReports = [...data.reports].filter((item) => item.report_type === "adaptive");
          const adaptiveReport = adaptiveReports.at(-1);
          if (adaptiveReport?.payload) setAdaptive(adaptiveReport.payload);
        }
      })
      .catch(() => {
        // Local storage remains the offline fallback.
      });

    return () => { cancelled = true; };
  }, [date]);

  useEffect(() => {
    if (!active) return;

    let previousKey = "";

    const checkHour = () => {
      const now = new Date();
      const timezone = safeTimeZone(plan?.goalContext?.timezone);
      const currentDate = localDate(timezone);
      const hour = Number(new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        hour12: false
      }).format(now));

      if (currentDate !== date || hour < 6 || hour > 22) return;

      const key = currentDate + "-" + hour;
      if (key === previousKey) return;
      previousKey = key;

      const existing = getLogsForDate(currentDate).find((log) => log.id === key);
      if (!existing) {
        const row = newRow(plan, currentDate, hour);
        setPromptRow(row);

        try {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("AuraMind check-in", {
              body: "Tell AuraMind what actually happened this hour."
            });
          }
        } catch {}
      }
    };

    checkHour();
    const timer = window.setInterval(checkHour, 30000);
    return () => window.clearInterval(timer);
  }, [active, date, plan]);

  const rows = useMemo(
    () => hours.map((hour) => logs.find((l) => l.id === date + "-" + hour) || newRow(plan, date, hour)),
    [date, logs, plan]
  );

  async function persistSession(payload: Record<string, unknown>) {
    if (!sessionToken) return;
    try {
      await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken
        },
        body: JSON.stringify(payload)
      });
    } catch {
      // Local storage remains the fallback.
    }
  }

  async function save(row: HourLog) {
    saveLog(row);
    const xpResult = calculateXp(row);
    const award = awardXpOnce(row.id, xpResult.earned);

    if (award.awarded) {
      setXp(award.total);
      setNotice("Saved · +" + xpResult.earned + " XP · Coaching…");
    } else {
      setNotice("Saved · Coaching…");
    }

    setLogs(getLogsForDate(date));
    setPromptRow(null);
    void persistSession({ action: "log", log: row });

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          log: row,
          recentLogs: getLogsForDate(row.date)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotice((data.coachMessage || data.immediateSolution || "Saved.") + " · +" + (award.awarded ? xpResult.earned : 0) + " XP");
      } else {
        setNotice(award.awarded ? "Saved · +" + xpResult.earned + " XP" : "Saved.");
      }
    } catch {
      setNotice(award.awarded ? "Saved · +" + xpResult.earned + " XP" : "Saved.");
    }

    window.setTimeout(() => setNotice(""), 7000);
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotice("Browser notifications are not supported here.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotice(permission === "granted" ? "Hourly notifications enabled." : "Notifications were not enabled.");
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function makeDaily() {
    setBusy("daily"); setNotice("");
    try {
      const res = await fetch("/api/report/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, plan, logs: rows })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Daily analysis failed.");
      saveDailyReport(data); setDaily(data);
      void persistSession({ action: "report", reportType: "daily", reportKey: date, payload: data });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Daily analysis failed.");
    } finally { setBusy(""); }
  }

  async function makeAdaptive() {
    setBusy("adaptive"); setNotice("");
    try {
      const res = await fetch("/api/plan/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          weeklyReport: weekly,
          logs: getLogs(),
          deadline: plan?.schedule?.at(-1)?.date || "",
          currentLevel: "",
          targetLevel: "",
          fixedSchedule: "",
          dailyHours: 3,
          timezone: "Asia/Kolkata"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Adaptive planning failed.");
      setAdaptive(data);
      void persistSession({ action: "report", reportType: "adaptive", reportKey: String(data.schedule?.[0]?.date ?? date), payload: data });
      setNotice("Next week has been rebuilt from your behavior data.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Adaptive planning failed.");
    } finally { setBusy(""); }
  }

  async function makeWeekly() {
    setBusy("weekly"); setNotice("");
    try {
      const res = await fetch("/api/report/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anchorDate: date, plan, logs: getLogs() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Weekly analysis failed.");
      saveWeeklyReport(data); setWeekly(data);
      void persistSession({ action: "report", reportType: "weekly", reportKey: data.weekStart, payload: data });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Weekly analysis failed.");
    } finally { setBusy(""); }
  }

  if (!plan) {
    return (
      <main className="shell">
        <nav className="nav"><a className="brand" href="/">Aura<span>Mind</span></a><div className="badge">Accountability Dashboard</div></nav>
        <section className="card">
          <h2>Create your first goal</h2>
          <p className="muted">Go back to the goal planner. The current V1 keeps its demo plan and logs in your browser until Supabase is connected.</p>
          <a className="btn linkbtn" href="/">Open goal planner →</a>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">Aura<span>Mind</span></a>
        <div className="navActions"><a className="navLink" href="/">New goal</a><div className="badge">Hourly Accountability</div></div>
      </nav>

      <section className="hero compactHero">
        <div className="kicker">Active goal</div>
        <h1>{plan.goal_summary}</h1>
        <p>{plan.weekly_focus}</p>
        <div className="stats">
          <div className="stat"><small>XP</small><strong>{xp.toLocaleString()} XP</strong></div>
          <div className="stat"><small>Goal</small><strong>{active ? "Active" : "Paused"}</strong></div>
          <div className="stat"><small>Tracking</small><strong>Every hour</strong></div>
          <div className="stat"><small>Daily</small><strong>AI diagnosis</strong></div>
          <div className="stat"><small>Weekly</small><strong>Pattern report</strong></div>
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="sectionHead">
          <div><h2>Hour-by-hour check-in</h2><p className="muted">Tell AuraMind what really happened. This is self-reported tracking; the app does not secretly monitor your device.</p></div>
          <input className="dateInput" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="hourGrid">
          {rows.map((row) => <HourRow key={row.id} row={row} onSave={save} />)}
        </div>
        {notice && <div className="notice">{notice}</div>}
      </section>

      <section className="grid" style={{ marginTop: 18 }}>
        <section className="card">
          <div className="sectionHead">
            <div><h2>Daily report</h2><p className="muted">AuraMind explains what went wrong and gives one practical adjustment.</p></div>
            <button className="btn smallbtn" disabled={busy !== ""} onClick={makeDaily}>{busy === "daily" ? "Analysing…" : "Analyse day"}</button>
          </div>
          {daily ? <DailyView report={daily} /> : <div className="empty">Finish your check-ins and generate the day's report.</div>}
        </section>

        <section className="card">
          <div className="sectionHead">
            <div><h2>Weekly intelligence</h2><p className="muted">The AI looks for repeated times, distractions and reasons across the week.</p></div>
            <button className="btn smallbtn" disabled={busy !== ""} onClick={makeWeekly}>{busy === "weekly" ? "Finding patterns…" : "Weekly report"}</button>
          </div>
          {weekly ? <WeeklyView report={weekly} /> : <div className="empty">Build several days of data, then run the weekly analysis.</div>}
        </section>
      </section>

      {weekly && (
        <section className="card" style={{ marginTop: 18 }}>
          <div className="sectionHead">
            <div>
              <h2>Adaptive next week</h2>
              <p className="muted">AuraMind uses the weekly evidence to change the next 7 days instead of repeating the same plan.</p>
            </div>
            <button className="btn smallbtn" disabled={busy !== ""} onClick={makeAdaptive}>
              {busy === "adaptive" ? "Rebuilding…" : "Build next week"}
            </button>
          </div>
          {adaptive ? (
            <div className="report">
              <div className="notice"><strong>What changed:</strong> {adaptive.adaptationSummary}</div>
              <div className="notice"><strong>Changes:</strong> {adaptive.changes.join(" · ")}</div>
              <div className="notice"><strong>Focus:</strong> {adaptive.weekly_focus}</div>
              {adaptive.schedule.map((day) => (
                <div className="day" key={day.date}>
                  <h3>{day.day} · {day.date}</h3>
                  {day.blocks.map((b, i) => (
                    <div className="block" key={i}>
                      <div className="time">{b.start}–{b.end}</div>
                      <div><strong>{b.activity}</strong><div className="reason">{b.reason}</div></div>
                      <div className="tag">{b.priority} · {b.category}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">Run the weekly report first. Then AuraMind can rebuild the following week using evidence.</div>
          )}
        </section>
      </section>

      {promptRow && (
        <div className="modalBackdrop">
          <div className="checkinModal">
            <div className="kicker">Hourly check-in</div>
            <h2>{promptRow.hourStart} → {promptRow.hourEnd}</h2>
            <p className="muted">Your planned activity was:</p>
            <div className="notice"><strong>{promptRow.plannedActivity}</strong></div>
            <p>Tell AuraMind what actually happened. After you save, AuraMind gives an immediate coaching response and awards XP based on the behavior you logged.</p>
            <HourRow row={promptRow} onSave={save} />
            <button className="navLink modalClose" onClick={() => setPromptRow(null)}>Remind me later</button>
          </div>
        </div>
      )}
      <div className="footer">AuraMind V1 · Plan → track → understand → improve.</div>
    </main>
  );
}

function HourRow({ row, onSave }: { row: HourLog; onSave: (row: HourLog) => void }) {
  const [draft, setDraft] = useState(row);
  useEffect(() => setDraft(row), [row.id, row.plannedActivity]);

  const change = (patch: Partial<HourLog>) => setDraft((current) => ({ ...current, ...patch }));

  return (
    <article className="hourRow">
      <div className="hourTime">{draft.hourStart}<span>{draft.hourEnd}</span></div>
      <div className="hourMain">
        <div className="planned"><span>Planned</span><strong>{draft.plannedActivity}</strong></div>
        <div className="formRow">
          <label>What did you actually do?
            <input value={draft.actualActivity} onChange={(e) => change({ actualActivity: e.target.value })} placeholder="Maths + 20 min YouTube" />
          </label>
          <label>Outcome
            <select value={draft.outcome} onChange={(e) => change({ outcome: e.target.value as HourLog["outcome"] })}>
              <option value="completed">Completed</option>
              <option value="partial">Partially completed</option>
              <option value="skipped">Skipped</option>
              <option value="different">Did something else</option>
            </select>
          </label>
        </div>
        <div className="formRow">
          <label>Focused minutes
            <input type="number" min="0" max="60" value={draft.focusedMinutes} onChange={(e) => change({ focusedMinutes: Math.max(0, Math.min(60, Number(e.target.value))) })} />
          </label>
          <label>Distraction minutes
            <input type="number" min="0" max="60" value={draft.distractionMinutes} onChange={(e) => change({ distractionMinutes: Math.max(0, Math.min(60, Number(e.target.value))) })} />
          </label>
          <label>Distraction
            <select value={draft.distractionCategory} onChange={(e) => change({ distractionCategory: e.target.value })}>
              <option value="">None</option>{distractionTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Why?
            <select value={draft.distractionReason} onChange={(e) => change({ distractionReason: e.target.value })}>
              <option value="">Choose reason</option>{reasons.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <label>Notes
          <input value={draft.notes} onChange={(e) => change({ notes: e.target.value })} placeholder="Optional context" />
        </label>
      </div>
      <button className="saveBtn" onClick={() => onSave(draft)}>Save</button>
    </article>
  );
}

function DailyView({ report }: { report: DailyReport }) {
  return <div className="report">
    <div className="stats">
      <div className="stat"><small>Completion</small><strong>{report.completionPercent}%</strong></div>
      <div className="stat"><small>Focused</small><strong>{report.focusedMinutes}m</strong></div>
      <div className="stat"><small>Distracted</small><strong>{report.distractionMinutes}m</strong></div>
    </div>
    <div className="notice"><strong>Strongest period:</strong> {report.strongestPeriod}</div>
    <div className="notice"><strong>Weakest period:</strong> {report.weakestPeriod}</div>
    <div className="notice"><strong>What went wrong:</strong> {report.keyProblem}</div>
    <div className="notice"><strong>Tomorrow's adjustment:</strong> {report.solution}</div>
    <p className="muted">{report.aiSummary}</p>
  </div>;
}

function WeeklyView({ report }: { report: WeeklyReport }) {
  return <div className="report">
    <div className="stats">
      <div className="stat"><small>Completion</small><strong>{report.completionPercent}%</strong></div>
      <div className="stat"><small>Focused</small><strong>{Math.round(report.focusedMinutes / 60)}h</strong></div>
      <div className="stat"><small>Distracted</small><strong>{Math.round(report.distractionMinutes / 60)}m</strong></div>
    </div>
    <div className="notice"><strong>Best period:</strong> {report.bestPeriod}</div>
    <div className="notice"><strong>Risk period:</strong> {report.worstPeriod}</div>
    <div className="notice"><strong>Top distractions:</strong> {report.topDistractions.join(", ") || "Not enough data"}</div>
    <div className="notice"><strong>Adaptive rule:</strong> AuraMind should change the next schedule when repeated evidence shows a timing, workload, difficulty, fatigue, or distraction problem.</div>
    <div className="notice"><strong>Recurring reasons:</strong> {report.recurringReasons.join(", ") || "Not enough data"}</div>
    <div className="notice"><strong>Patterns:</strong> {report.patterns.join(" · ") || "Not enough repeated patterns yet."}</div>
    <div className="notice"><strong>Next-week changes:</strong> {report.recommendations.join(" · ") || "Keep logging to unlock recommendations."}</div>
    <p className="muted">{report.aiSummary}</p>
  </div>;
}
