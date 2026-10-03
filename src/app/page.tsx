"use client";

import { FormEvent, useState } from "react";
import { savePlan, setGoalActive } from "../lib/storage";

type Block = {start:string;end:string;activity:string;category:string;priority:"high"|"medium"|"low";reason:string};
type Day = {day:string;date:string;blocks:Block[]};
type Plan = {
  engine?: "gemini"|"ai"|"core"|"openai"|"demo";
  goal_summary:string;
  success_definition:string;
  weekly_focus:string;
  risk_notes:string[];
  milestones?: {title:string;outcome:string;timing:string}[];
  research?: {research_summary:string;requirements:string[];prerequisites:string[];common_bottlenecks:string[];strategy:string[]};
  researchSources?: {title:string;url:string}[];
  goalContext?: {goal:string;deadline:string;currentLevel:string;targetLevel:string;fixedSchedule:string;dailyHours:number;timezone:string;preferredFocusTime:string;knownDistractions:string;pastAttempts:string;constraints:string};
  schedule:Day[];
};

export default function Home() {
  const [form,setForm]=useState({goal:"",deadline:"",currentLevel:"",targetLevel:"",fixedSchedule:"",dailyHours:"3",preferredFocusTime:"",knownDistractions:"",pastAttempts:"",constraints:""});
  const [plan,setPlan]=useState<Plan|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setPlan(null);
    try {
      const res=await fetch("/api/goal",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,dailyHours:Number(form.dailyHours),timezone:"Asia/Kolkata"})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Something went wrong.");
      setPlan(data);
      savePlan(data);
    } catch(err) {
      setError(err instanceof Error?err.message:"Something went wrong.");
    } finally { setLoading(false); }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <a href="/" className="brand">Aura<span>Mind</span></a>
        <div className="navActions">
          <a className="navLink" href="/dashboard">Open Dashboard</a>
          <div className="badge">AI Accountability Engine · V1</div>
        </div>
      </nav>

      <section className="hero">
        <div className="kicker">Plan your real life</div>
        <h1>Don't plan a perfect day. Build a system that learns your real one.</h1>
        <p>AuraMind researches the goal, combines it with your real timetable, and builds a 7-day operating plan. Then you report what actually happened hour by hour so AuraMind can analyse distractions and improve the next plan.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Create your goal</h2>
          <p className="muted">AuraMind needs enough context to build around your real life—not a generic template.</p>
          <form onSubmit={submit} className="formgrid">
            <label className="full">Goal
              <input required value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})} placeholder="Score 85% in Class 10 boards" />
            </label>
            <label>Deadline
              <input required type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})} />
            </label>
            <label>Current level
              <input required value={form.currentLevel} onChange={e=>setForm({...form,currentLevel:e.target.value})} placeholder="Weak Maths foundation" />
            </label>
            <label>Target level
              <input required value={form.targetLevel} onChange={e=>setForm({...form,targetLevel:e.target.value})} placeholder="70+ marks" />
            </label>
            <label>Available focus time/day
              <select value={form.dailyHours} onChange={e=>setForm({...form,dailyHours:e.target.value})}>
                {[1,2,3,4,5,6].map(h=><option key={h} value={h}>{h} hours</option>)}
              </select>
            </label>
            <label className="full">Fixed commitments
              <textarea value={form.fixedSchedule} onChange={e=>setForm({...form,fixedSchedule:e.target.value})} placeholder={"School: 7:30 AM–2:00 PM\nTuition: 4:00 PM–6:00 PM\nSleep: 11:00 PM–6:30 AM"} />
            </label>
            <label>Best focus time
              <select value={form.preferredFocusTime} onChange={e=>setForm({...form,preferredFocusTime:e.target.value})}>
                <option value="">Let AuraMind infer</option>
                <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Late night</option>
              </select>
            </label>
            <label className="full">Known distractions
              <input value={form.knownDistractions} onChange={e=>setForm({...form,knownDistractions:e.target.value})} placeholder="Phone, YouTube after difficult tasks, gaming, notifications..." />
            </label>
            <label className="full">What has stopped you before?
              <textarea value={form.pastAttempts} onChange={e=>setForm({...form,pastAttempts:e.target.value})} placeholder="Plans were too long, I avoid hard topics, I lose focus after tuition..." />
            </label>
            <label className="full">Other constraints
              <textarea value={form.constraints} onChange={e=>setForm({...form,constraints:e.target.value})} placeholder="Travel, family responsibilities, preferred rest days, equipment limits..." />
            </label>
            <div className="full"><button className="btn" disabled={loading}>{loading?"Building your plan…":"Research goal + build plan"}</button></div>
          </form>
          {error&&<div className="error">{error}</div>}
        </div>

        <div className="card">
          <h2>AuraMind loop</h2>
          <div className="flow">
            <div>01 · Goal → milestones</div>
            <div>02 · Milestones → realistic workload</div>
            <div>03 · Workload → hourly schedule</div>
            <div>04 · Actual hour → behavior data</div>
            <div>05 · Day → AI diagnosis + solution</div>
            <div>06 · Week → recurring patterns + next plan</div>
          </div>
        </div>
      </section>

      {plan&&<section className="card" style={{marginTop:18}}>
        <div className="sectionHead">
          <div>
            <h2>Generated plan</h2>
            <p className="muted">{plan.goal_summary}</p>
          </div>
          <button className="btn linkbtn" onClick={() => { setGoalActive(true); window.location.href="/dashboard"; }}>Start Goal →</button>
        </div>

        <div className="stats">
          <div className="stat"><small>Days planned</small><strong>{plan.schedule.length}</strong></div>
          <div className="stat"><small>Planning mode</small><strong>Adaptive</strong></div>
          <div className="stat"><small>Tracking</small><strong>Hourly</strong></div>
        </div>

        <div className="notice">
          <strong>Engine:</strong> {plan.engine === "gemini" ? "Gemini + live web research" : plan.engine === "ai" ? "AI research + reasoning" : "AuraMind Core"}.
          {plan.engine === "core" && " Add the Gemini and Tavily keys in Vercel to unlock the full research-first engine."}
        </div>
        {plan.research && (
          <div className="researchPanel">
            <div className="sectionHead"><div><h3>Goal Research</h3><p className="muted">{plan.research.research_summary}</p></div></div>
            <div className="researchGrid">
              <div><strong>Requirements</strong><ul>{plan.research.requirements.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
              <div><strong>Prerequisites</strong><ul>{plan.research.prerequisites.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
              <div><strong>Common bottlenecks</strong><ul>{plan.research.common_bottlenecks.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
              <div><strong>Strategy</strong><ul>{plan.research.strategy.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            </div>
            {plan.researchSources && plan.researchSources.length > 0 && (
              <div className="sources"><strong>Sources</strong>{plan.researchSources.map((s,i)=><a key={i} href={s.url} target="_blank" rel="noreferrer">{s.title}</a>)}</div>
            )}
          </div>
        )}
        {plan.milestones && (
          <div className="notice"><strong>Milestones:</strong> {plan.milestones.map((m)=>m.title+" — "+m.timing).join(" · ")}</div>
        )}
        <div className="notice"><strong>Success definition:</strong> {plan.success_definition}</div>
        <div className="notice"><strong>Weekly focus:</strong> {plan.weekly_focus}</div>

        {plan.schedule.map(day=><div className="day" key={day.date}>
          <h3>{day.day} · {day.date}</h3>
          {day.blocks.map((b,i)=><div className="block" key={i}>
            <div className="time">{b.start}–{b.end}</div>
            <div><strong>{b.activity}</strong><div className="reason">{b.reason}</div></div>
            <div className="tag">{b.priority} · {b.category}</div>
          </div>)}
        </div>)}

        <div className="notice"><strong>Planning risks:</strong> {plan.risk_notes.join(" · ")}</div>
      </section>}

      <div className="footer">AuraMind · Goal planning → hourly accountability → behavioral intelligence.</div>
    </main>
  );
}
