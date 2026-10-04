"use client";

import { useEffect, useMemo, useState } from "react";

type Request = {
  request_code: string; goal: string; deadline: string; current_level: string; target_level: string;
  fixed_schedule: string; daily_hours: number; timezone: string; preferred_focus_time: string; known_distractions: string; past_attempts: string; constraints: string; status: "pending"|"researching"|"review"|"ready"|"archived"; research: any; plan: any; created_at: string; ready_at?: string|null;
};

export default function Admin() {
  const [key,setKey]=useState("");
  const [requests,setRequests]=useState<Request[]>([]);
  const [selected,setSelected]=useState<Request|null>(null);
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const [research,setResearch]=useState({research_summary:"",requirements:"",prerequisites:"",common_bottlenecks:"",strategy:""});

  const openCount=useMemo(()=>requests.filter(r=>r.status!=="ready"&&r.status!=="archived").length,[requests]);

  useEffect(()=>{ const saved=window.localStorage.getItem("auramind-admin-key"); if(saved) setKey(saved); },[]);

  async function load() {
    if(!key){setMessage("Enter the admin key.");return;}
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/admin/requests",{headers:{"x-admin-key":key},cache:"no-store"});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Could not load requests.");
      setRequests(data.requests||[]);window.localStorage.setItem("auramind-admin-key",key);
    }catch(e){setMessage(e instanceof Error?e.message:"Could not load requests.");}
    finally{setBusy(false);}
  }

  function selectRequest(item:Request){
    setSelected(item);
    setResearch({
      research_summary:item.research?.research_summary||"",
      requirements:(item.research?.requirements||[]).join("\n"),
      prerequisites:(item.research?.prerequisites||[]).join("\n"),
      common_bottlenecks:(item.research?.common_bottlenecks||[]).join("\n"),
      strategy:(item.research?.strategy||[]).join("\n")
    });
  }

  async function update(action:string){
    if(!selected)return;
    setBusy(true);setMessage("");
    try{
      const res=await fetch("/api/admin/requests",{
        method:"PATCH",
        headers:{"Content-Type":"application/json","x-admin-key":key},
        body:JSON.stringify({requestId:selected.request_code,action,...research})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Action failed.");
      setMessage(action==="generate-plan"?"30-day timetable generated. Review it, then release it to the user.":action==="release"?"Request released to the user.":"Saved.");
      if (action === "generate-plan") setSelected(prev => prev ? { ...prev, status: "review", plan: data.plan || prev.plan } : prev);
      if (action === "release") setSelected(prev => prev ? { ...prev, status: "ready" } : prev);
      await load();
    }catch(e){setMessage(e instanceof Error?e.message:"Admin action failed.");}
    finally{setBusy(false);}
  }

  return (
    <main className="shell">
      <nav className="nav"><a className="brand" href="/">Aura<span>Mind</span></a><div className="navActions"><a className="navLink" href="/">User site</a><div className="badge">Private Research Admin</div></div></nav>

      <section className="hero compactHero">
        <div className="kicker">Private workspace</div>
        <h1>Research queue.</h1>
        <p>Open a goal request, do the research yourself, save the evidence, then generate and review the 30-day timetable before releasing it.</p>
      </section>

      <section className="grid">
        <div className="card">
          <h2>Admin access</h2>
          <div className="formRow"><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Admin key"/><button className="btn" onClick={load} disabled={busy}>{busy?"Loading…":"Load requests"}</button></div>
          <div className="notice"><strong>Open requests:</strong> {openCount}</div>
          {message&&<div className="notice">{message}</div>}
        </div>

        <div className="card">
          <h2>Requests</h2>
          {requests.length===0?<div className="empty">Load requests to see the queue.</div>:(
            <div className="flow">{requests.map(item=>(
              <button key={item.request_code} className="navLink" style={{textAlign:"left",borderRadius:14}} onClick={()=>selectRequest(item)}>
                <strong>{item.request_code}</strong> · {item.status}<br/><span className="muted">{item.goal}</span>
              </button>
            ))}</div>
          )}
        </div>
      </section>

      {selected&&<section className="card" style={{marginTop:18}}>
        <div className="sectionHead"><div><div className="kicker">{selected.status}</div><h2>{selected.request_code}</h2><p className="muted">{selected.goal} · {selected.current_level} → {selected.target_level} · deadline {selected.deadline}</p><p className="muted">Received {new Date(selected.created_at).toLocaleString()}</p></div></div>

        <div className="notice"><strong>User context:</strong> Use these real constraints as part of the research and timetable design.</div>
        <div className="researchGrid">
          <div className="notice"><strong>Fixed commitments</strong><br/>{selected.fixed_schedule || "None supplied"}</div>
          <div className="notice"><strong>Focus time/day</strong><br/>{selected.daily_hours} hours</div>
          <div className="notice"><strong>Preferred focus</strong><br/>{selected.preferred_focus_time || "Not specified"}</div>
          <div className="notice"><strong>Known distractions</strong><br/>{selected.known_distractions || "None supplied"}</div>
          <div className="notice"><strong>Past attempts</strong><br/>{selected.past_attempts || "None supplied"}</div>
          <div className="notice"><strong>Other constraints</strong><br/>{selected.constraints || "None supplied"}</div>
        </div>

        <div className="researchGrid">
          <label>Research summary<textarea value={research.research_summary} onChange={e=>setResearch({...research,research_summary:e.target.value})} placeholder="Your researched conclusion and evidence."/></label>
          <label>Requirements (one per line)<textarea value={research.requirements} onChange={e=>setResearch({...research,requirements:e.target.value})}/></label>
          <label>Prerequisites (one per line)<textarea value={research.prerequisites} onChange={e=>setResearch({...research,prerequisites:e.target.value})}/></label>
          <label>Common bottlenecks (one per line)<textarea value={research.common_bottlenecks} onChange={e=>setResearch({...research,common_bottlenecks:e.target.value})}/></label>
          <label>Strategy (one per line)<textarea value={research.strategy} onChange={e=>setResearch({...research,strategy:e.target.value})}/></label>
        </div>

        <div className="dashboardActions" style={{marginTop:14}}>
          <button className="btn" onClick={()=>update("start")} disabled={busy}>Start research</button>
          <button className="btn" onClick={()=>update("save-research")} disabled={busy}>Save research</button>
          <button className="btn" onClick={()=>update("generate-plan")} disabled={busy}>Generate 30-day timetable</button>
            <button className="btn" onClick={()=>update("release")} disabled={busy || selected.status !== "review"}>Release to user</button>
        </div>

        {selected.plan&&<div className="notice"><strong>Timetable already saved:</strong> {selected.plan.schedule?.length||0} days.</div>}
      </section>}

      <div className="footer">AuraMind Admin · Human research → 30-day plan → release.</div>
    </main>
  );
}
