"use client";

import { FormEvent, useEffect, useState } from "react";
import { savePlan, setGoalActive } from "../lib/storage";

type Plan = {
  goal_summary: string;
  success_definition: string;
  weekly_focus: string;
  risk_notes: string[];
  milestones?: { title: string; outcome: string; timing: string }[];
  research?: { research_summary: string; requirements: string[]; prerequisites: string[]; common_bottlenecks: string[]; strategy: string[] };
  schedule: Array<{ day: string; date: string; blocks: Array<{ start: string; end: string; activity: string; category: string; priority: "high"|"medium"|"low"; reason: string }> }>;
};

export default function Home() {
  const [form, setForm] = useState({
    goal: "", deadline: "", currentLevel: "", targetLevel: "", fixedSchedule: "",
    dailyHours: "3", preferredFocusTime: "", knownDistractions: "", pastAttempts: "", constraints: ""
  });
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [lookupId, setLookupId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("auramind:last-request-id");
    if (saved) { setRequestId(saved); setLookupId(saved); }
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setStatus(null);
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, dailyHours: Number(form.dailyHours), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit the request.");
      setRequestId(data.requestId); setLookupId(data.requestId); setStatus(data);
      window.localStorage.setItem("auramind:last-request-id", data.requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit the request.");
    } finally { setLoading(false); }
  }

  async function check(id = lookupId) {
    const code = id.trim().toUpperCase();
    if (!code) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/request/" + encodeURIComponent(code), { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request not found.");
      setRequestId(data.requestId); setStatus(data);
      window.localStorage.setItem("auramind:last-request-id", data.requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check the request.");
    } finally { setLoading(false); }
  }

  function startGoal(plan: Plan) {
    savePlan(plan as any); setGoalActive(true); window.location.href = "/dashboard";
  }

  async function copyId() {
    if (!requestId) return;
    try { await navigator.clipboard.writeText(requestId); } catch {}
    setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  }

  const statusLabel =
    status?.status === "ready" ? "Research completed" :
    status?.status === "review" ? "Plan under review" :
    status?.status === "researching" ? "Research in progress" : "Request received";
  const eta = status?.etaAt ? new Date(status.etaAt).toLocaleString() : "";

  return (
    <main className="shell">
      <nav className="nav">
        <a href="/" className="brand">Aura<span>Mind</span></a>
        <div className="navActions">
          <a className="navLink" href="/dashboard">Dashboard</a>
          <a className="navLink" href="/admin">Admin</a>
          <div className="badge">Human-researched accountability</div>
        </div>
      </nav>

      <section className="hero">
        <div className="kicker">Research before action</div>
        <h1>Your goal gets researched before AuraMind builds the plan.</h1>
        <p>Submit the goal once. AuraMind gives you a request ID, the request enters a research queue, and the personalized 30-day timetable is released when the research is complete.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Submit a goal request</h2>
          <p className="muted">Give enough context for a real plan instead of a generic template.</p>
          <form onSubmit={submit} className="formgrid">
            <label className="full">Goal
              <input required value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})} placeholder="Reach German B2 by June 2028" />
            </label>
            <label>Deadline
              <input required type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} />
            </label>
            <label>Current level
              <input required value={form.currentLevel} onChange={e=>setForm({...form,currentLevel:e.target.value})} placeholder="A1" />
            </label>
            <label>Target level
              <input required value={form.targetLevel} onChange={e=>setForm({...form,targetLevel:e.target.value})} placeholder="B2" />
            </label>
            <label>Focus time/day
              <select value={form.dailyHours} onChange={e=>setForm({...form,dailyHours:e.target.value})}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(h=><option key={h} value={h}>{h} hours</option>)}
              </select>
            </label>
            <label>Best focus time
              <select value={form.preferredFocusTime} onChange={e=>setForm({...form,preferredFocusTime:e.target.value})}>
                <option value="">Let researcher decide</option><option>Morning</option><option>Afternoon</option><option>Evening</option>
              </select>
            </label>
            <label className="full">Fixed commitments
              <textarea value={form.fixedSchedule} onChange={e=>setForm({...form,fixedSchedule:e.target.value})} placeholder={"School: 7:30 AM–2:00 PM\nTuition: 4:00 PM–6:00 PM\nSleep: 11:00 PM–6:30 AM"} />
            </label>
            <label className="full">Known distractions
              <input value={form.knownDistractions} onChange={e=>setForm({...form,knownDistractions:e.target.value})} placeholder="Phone, YouTube after hard tasks, gaming..." />
            </label>
            <label className="full">What stopped you before?
              <textarea value={form.pastAttempts} onChange={e=>setForm({...form,pastAttempts:e.target.value})} placeholder="Plans were too long, I avoid difficult topics..." />
            </label>
            <label className="full">Other constraints
              <textarea value={form.constraints} onChange={e=>setForm({...form,constraints:e.target.value})} placeholder="Travel, family responsibilities, equipment, rest days..." />
            </label>
            <div className="full"><button className="btn" disabled={loading}>{loading ? "Submitting…" : "Submit goal request"}</button></div>
          </form>
          {error && <div className="error">{error}</div>}
        </div>

        <div className="card">
          <h2>How your request works</h2>
          <div className="flow">
            <div>01 · Submit goal + context</div><div>02 · Get a unique request ID</div><div>03 · Human research begins</div>
            <div>04 · Research → 30-day timetable</div><div>05 · Completed plan is released</div><div>06 · Start Goal → hourly accountability</div>
          </div>
          <div className="notice"><strong>Research window:</strong> up to 12 hours.</div>
        </div>
      </section>

      <section className="grid" style={{marginTop:18}}>
        <div className="card">
          <h2>Check request status</h2>
          <p className="muted">Enter the request ID you received.</p>
          <div className="formRow">
            <input value={lookupId} onChange={e=>setLookupId(e.target.value.toUpperCase())} placeholder="AM-1A2B3C4D" />
            <button className="btn" onClick={()=>check()} disabled={loading}>{loading ? "Checking…" : "Check status"}</button>
          </div>
        </div>

        {requestId && status && (
          <div className="card">
            <div className="sectionHead">
              <div><div className="kicker">{statusLabel}</div><h2>{requestId}</h2><p className="muted">{status.goal}</p></div>
              <button className="navLink" onClick={copyId}>{copied ? "Copied" : "Copy ID"}</button>
            </div>
            <div className="notice"><strong>Status:</strong> {status.status}</div>
            {eta && status.status !== "ready" && <div className="notice"><strong>Research target:</strong> {eta}</div>}
            {status.readyAt && <div className="notice"><strong>Ready:</strong> {new Date(status.readyAt).toLocaleString()}</div>}
            {status.status === "ready" && status.plan ? (
              <button className="btn" onClick={()=>startGoal(status.plan)}>Start 30-Day Goal →</button>
            ) : (
              <div className="empty">Your 30-day timetable will appear here when the research is completed.</div>
            )}
          </div>
        )}
      </section>

      <div className="footer">AuraMind · Request → research → 30-day plan → accountability → adaptation.</div>
    </main>
  );
}
