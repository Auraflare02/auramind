"use client";

import { FormEvent, useState } from "react";

type Block = {start:string;end:string;activity:string;category:string;priority:"high"|"medium"|"low";reason:string};
type Day = {day:string;date:string;blocks:Block[]};
type Plan = {goal_summary:string;success_definition:string;weekly_focus:string;risk_notes:string[];schedule:Day[]};

export default function Home() {
  const [form,setForm]=useState({goal:"",deadline:"",currentLevel:"",targetLevel:"",fixedSchedule:"",dailyHours:"3"});
  const [plan,setPlan]=useState<Plan|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function submit(e:FormEvent) {
    e.preventDefault(); setLoading(true); setError(""); setPlan(null);
    try {
      const res=await fetch("/api/plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,dailyHours:Number(form.dailyHours),timezone:"Asia/Kolkata"})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Something went wrong.");
      setPlan(data);
    } catch(err) {
      setError(err instanceof Error?err.message:"Something went wrong.");
    } finally { setLoading(false); }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand">Aura<span>Mind</span></div>
        <div className="badge">AI Accountability Engine · V1</div>
      </nav>

      <section className="hero">
        <div className="kicker">Plan your real life</div>
        <h1>Don't plan a perfect day. Build a system that learns your real one.</h1>
        <p>AuraMind turns a goal and real timetable into a 7-day plan. The next layers will track every hour, detect distraction patterns, produce daily reports and learn from weekly behavior.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Create your goal</h2>
          <p className="muted">AuraMind needs your current reality, not just your dream.</p>
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
            <div className="full"><button className="btn" disabled={loading}>{loading?"Building your plan…":"Generate 7-day plan"}</button></div>
          </form>
          {error&&<div className="error">{error}</div>}
        </div>

        <div className="card">
          <h2>AuraMind loop</h2>
          <div className="flow">
            <div>01 · Goal → milestones</div>
            <div>02 · Milestones → realistic workload</div>
            <div>03 · Workload → hourly schedule</div>
            <div>04 · Actual day → behavior data</div>
            <div>05 · Behavior → daily report</div>
            <div>06 · Weekly patterns → better next week</div>
          </div>
        </div>
      </section>

      {plan&&<section className="card" style={{marginTop:18}}>
        <h2>Generated plan</h2>
        <p className="muted">{plan.goal_summary}</p>
        <div className="stats">
          <div className="stat"><small>Days planned</small><strong>{plan.schedule.length}</strong></div>
          <div className="stat"><small>Planning mode</small><strong>Adaptive</strong></div>
          <div className="stat"><small>Accountability</small><strong>Hourly</strong></div>
        </div>
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

      <div className="footer">AuraMind · Goal planning is V1. Hourly accountability and behavioral intelligence are next.</div>
    </main>
  );
}
