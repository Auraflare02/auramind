"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GOAL_CATEGORIES, getCategoryConfig } from "@/lib/categories";

export default function HomePage() {
  // Goal creation form state
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("coding_technology");
  const [deadline, setDeadline] = useState("");
  const [currentLevel, setCurrentLevel] = useState("beginner");
  const [targetLevel, setTargetLevel] = useState("intermediate");
  const [customCurrentLevel, setCustomCurrentLevel] = useState("");
  const [customTargetLevel, setCustomTargetLevel] = useState("");
  const [language, setLanguage] = useState("");
  const [currentScore, setCurrentScore] = useState("");
  const [targetScore, setTargetScore] = useState("");
  const [hours, setHours] = useState(2.5);
  const [focus, setFocus] = useState<"morning" | "afternoon" | "evening" | "night">("morning");
  const [fixed, setFixed] = useState("");
  const [distractions, setDistractions] = useState("");
  const [previous, setPrevious] = useState("");
  const [constraints, setConstraints] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  // Lookup state
  const [lookupCode, setLookupCode] = useState("");

  // Submission state & AI Synthesis state
  const [busy, setBusy] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [err, setErr] = useState("");
  const [createdRequest, setCreatedRequest] = useState<{
    id: string;
    requestCode: string;
    plan?: any;
    researchData?: any;
  } | null>(null);
  const [isStartingDirectly, setIsStartingDirectly] = useState(false);

  // Auto-detect timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      // Default to UTC
    }
  }, []);

  // Animate generation steps while busy
  useEffect(() => {
    if (!busy) {
      setGenerationStep(0);
      return;
    }
    const interval = setInterval(() => {
      setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [busy]);

  // Update level defaults when category changes
  const activeCategoryConfig = getCategoryConfig(category);

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const newConfig = getCategoryConfig(newCat);
    if (newConfig.levels.length > 0) {
      setCurrentLevel(newConfig.levels[0].id);
      setTargetLevel(newConfig.levels[Math.min(3, newConfig.levels.length - 1)].id);
    }
    setHours(newConfig.defaultFocusHours);
  };

  async function submitGoal(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    setGenerationStep(0);

    try {
      const payload = {
        goal: goal.trim(),
        category,
        deadline: deadline || undefined,
        current_level: currentLevel === "custom" ? customCurrentLevel.trim() || "Custom Level" : currentLevel,
        target_level: targetLevel === "custom" ? customTargetLevel.trim() || "Custom Target" : targetLevel,
        custom_current_level: customCurrentLevel ? customCurrentLevel.trim() : undefined,
        custom_target_level: customTargetLevel ? customTargetLevel.trim() : undefined,
        language: language ? language.trim() : undefined,
        current_score: currentScore ? currentScore.trim() : undefined,
        target_score: targetScore ? targetScore.trim() : undefined,
        hours: Number(hours),
        focus,
        fixed: fixed.trim(),
        distractions: distractions.trim(),
        previous: previous.trim(),
        constraints: constraints.trim(),
        timezone,
      };

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate goal timetable.");
      }

      setCreatedRequest({
        id: data.id,
        requestCode: data.request_code,
        plan: data.plan,
        researchData: data.research_data,
      });
    } catch (e: any) {
      setErr(e.message || "An unexpected error occurred. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function launchDay1Now(id: string) {
    if (isStartingDirectly) return;
    setIsStartingDirectly(true);
    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.session_token) {
        localStorage.setItem(`auramind_session_${id}`, data.session_token);
      }
      window.location.href = `/goal/${id}`;
    } catch {
      window.location.href = `/goal/${id}`;
    }
  }

  const GEN_STEPS = [
    { title: "Analyzing Baseline & Cognitive Window", desc: `Calibrating daily ${hours}h budget during your ${focus} energy window...` },
    { title: "Conducting Pedagogical Research", desc: "Modeling skill acquisition dynamics and common behavioral failure modes..." },
    { title: "Synthesizing 30-Day Phased Architecture", desc: "Constructing daily deliberate practice drills and active recall blocks..." },
    { title: "Finalizing Timetable & Check-In Loops", desc: "Structuring 7-day recovery buffers and diagnostic milestones..." },
  ];

  return (
    <div className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
      {/* HERO SECTION */}
      <section style={{ textAlign: "center", marginBottom: "70px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "999px",
            backgroundColor: "var(--yellow-muted)",
            border: "1px solid var(--yellow-border)",
            color: "var(--yellow-primary)",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "24px",
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--yellow-primary)" }} />
          Learning Science &bull; Behavioral Accountability &bull; Instant AI Synthesis
        </div>

        <h1 style={{ fontSize: "2.8rem", maxWidth: "860px", margin: "0 auto 20px" }}>
          Don't plan a perfect day. <br />
          <span style={{ color: "var(--yellow-primary)" }}>Build a system that learns your real one.</span>
        </h1>

        <p style={{ fontSize: "1.2rem", maxWidth: "700px", margin: "0 auto 32px", color: "var(--text-secondary)" }}>
          AuraMind researches your goal, instantly engineers a personalized 30-day timetable in front of you, and adapts your schedule based on what actually happens in reality.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <a href="#create-goal" className="btn btn-primary btn-lg">
            Create Your 30-Day Goal Now &rarr;
          </a>
          <a href="#how-it-works" className="btn btn-secondary btn-lg">
            How It Works
          </a>
        </div>
      </section>

      {/* ACCOUNTABILITY LOOP VISUALIZATION */}
      <section id="how-it-works" style={{ marginBottom: "80px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <h2>The AuraMind Closed-Loop System</h2>
          <p>Traditional habit trackers assume perfect willpower. AuraMind adapts to behavioral signals.</p>
        </div>

        <div className="grid-4">
          <div className="card card-highlight">
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--yellow-primary)", marginBottom: "8px" }}>01</div>
            <h3>Instant AI Research</h3>
            <p className="text-sm">We analyze prerequisites, skill acquisition stages, and common failure modes for your specific starting level.</p>
          </div>
          <div className="card card-highlight">
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--yellow-primary)", marginBottom: "8px" }}>02</div>
            <h3>Live Timetable Synthesis</h3>
            <p className="text-sm">Gemini generates an exact 30-day curriculum respecting your available hours, peak focus window, and existing commitments.</p>
          </div>
          <div className="card card-highlight">
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--yellow-primary)", marginBottom: "8px" }}>03</div>
            <h3>Hourly Check-Ins</h3>
            <p className="text-sm">Log what actually happened. Missed tasks are treated as diagnostic signals to adjust cognitive load, not as moral failures.</p>
          </div>
          <div className="card card-highlight">
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--yellow-primary)", marginBottom: "8px" }}>04</div>
            <h3>Adaptive Timetable</h3>
            <p className="text-sm">Weekly behavioral analytics identify your strongest periods and auto-restructure upcoming weeks to keep you moving forward.</p>
          </div>
        </div>
      </section>

      {/* SAMPLE TIMETABLE PREVIEW */}
      <section style={{ marginBottom: "80px" }}>
        <div className="card" style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
          <div className="flex-between" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
            <div>
              <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Curriculum Architecture</span>
              <h3 style={{ margin: 0 }}>Sample 30-Day Phased Architecture</h3>
            </div>
            <span className="text-xs text-muted">Days 1&ndash;7: Foundation &bull; Days 8&ndash;15: Deliberate Practice &bull; Days 16&ndash;22: Application</span>
          </div>

          <div className="grid-3" style={{ gap: "12px" }}>
            <div className="task-block priority-high">
              <div className="text-xs text-muted">07:00 &ndash; 07:45 &bull; Learn (High Priority)</div>
              <strong style={{ color: "var(--text-primary)" }}>Core Concept Intake &amp; Mental Models</strong>
              <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>Hardest cognitive intake scheduled during your peak focus window.</div>
            </div>
            <div className="task-block priority-medium">
              <div className="text-xs text-muted">07:55 &ndash; 08:35 &bull; Practice</div>
              <strong style={{ color: "var(--text-primary)" }}>Deliberate Problem Drills &amp; Edge Cases</strong>
              <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>Immediate guided exercises reinforce newly learned neural connections.</div>
            </div>
            <div className="task-block priority-low">
              <div className="text-xs text-muted">08:45 &ndash; 09:05 &bull; Review</div>
              <strong style={{ color: "var(--text-primary)" }}>Active Retrieval &amp; Check-In Reflection</strong>
              <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>Self-quiz in your own words to verify durability of concepts.</div>
            </div>
          </div>
        </div>
      </section>

      {/* GOAL CREATION & LIVE SYNTHESIS */}
      <section id="create-goal" style={{ marginBottom: "80px" }}>
        <div className="container-narrow">
          {/* STATE 1: INSTANT TIMETABLE READY */}
          {createdRequest ? (
            <div className="card card-highlight" style={{ textAlign: "center", padding: "40px 24px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--yellow-muted)",
                  border: "2px solid var(--yellow-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "var(--yellow-primary)",
                  margin: "0 auto 16px",
                }}
              >
                &#10003;
              </div>

              <span className="badge badge-yellow" style={{ marginBottom: "10px" }}>AI Synthesis Complete</span>
              <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Your 30-Day Timetable is Ready!</h2>
              <p style={{ maxWidth: "560px", margin: "0 auto 20px", color: "var(--text-secondary)" }}>
                Our AI has researched your learning path, resolved common bottlenecks, and engineered an exact day-by-day plan tailored to your available hours.
              </p>

              {/* Unique Request Code Pill */}
              <div
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--yellow-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 24px",
                  marginBottom: "24px",
                  display: "inline-block",
                }}
              >
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                  Your Unique Access Code
                </div>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--yellow-primary)", fontFamily: "monospace" }}>
                  {createdRequest.requestCode}
                </div>
              </div>

              {/* Plan Overview Preview */}
              {createdRequest.plan && (
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "left",
                    marginBottom: "24px",
                  }}
                >
                  <div style={{ color: "var(--yellow-primary)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "6px" }}>
                    Executive Curriculum Roadmap:
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "16px" }}>
                    {createdRequest.plan.goal_summary}
                  </p>

                  <div style={{ color: "var(--yellow-primary)", fontWeight: 700, fontSize: "0.95rem", marginBottom: "8px" }}>
                    4-Week Phased Milestones:
                  </div>
                  <div className="grid-2" style={{ gap: "8px" }}>
                    {createdRequest.plan.weekly_focus?.map((wf: any) => (
                      <div
                        key={wf.week}
                        style={{
                          backgroundColor: "var(--bg-elevated)",
                          padding: "10px 12px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>
                          Week {wf.week}: {wf.title}
                        </strong>
                        <div className="text-xs text-muted" style={{ marginTop: "2px" }}>
                          {wf.expected_outcome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Call to Action Buttons */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  disabled={isStartingDirectly}
                  onClick={() => launchDay1Now(createdRequest.id)}
                  style={{ minWidth: "220px" }}
                >
                  {isStartingDirectly ? "Starting Day 1…" : "Start Day 1 Now \u2192"}
                </button>
                <Link href={`/goal/${createdRequest.id}`} className="btn btn-secondary btn-lg">
                  Review 30-Day Plan &rarr;
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={() => {
                    setCreatedRequest(null);
                    setGoal("");
                  }}
                >
                  Create Another Goal
                </button>
              </div>
            </div>
          ) : busy ? (
            /* STATE 2: LIVE AI SYNTHESIS IN PROGRESS */
            <div className="card card-highlight" style={{ padding: "40px 24px", textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--yellow-muted)",
                  border: "2px solid var(--yellow-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "var(--yellow-primary)",
                  margin: "0 auto 20px",
                  animation: "pulse 1.5s infinite",
                }}
              >
                &#9889;
              </div>

              <h2 style={{ fontSize: "1.9rem", marginBottom: "8px" }}>Engineering Your 30-Day Timetable</h2>
              <p style={{ maxWidth: "520px", margin: "0 auto 28px", color: "var(--text-secondary)" }}>
                AuraMind AI is actively analyzing your starting baseline and architecting your daily deliberate practice curriculum.
              </p>

              {/* Dynamic Step Progress */}
              <div style={{ maxWidth: "520px", margin: "0 auto 28px", textAlign: "left" }}>
                {GEN_STEPS.map((step, idx) => {
                  const isDone = idx < generationStep;
                  const isCurrent = idx === generationStep;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        marginBottom: "8px",
                        backgroundColor: isCurrent ? "var(--bg-elevated)" : "transparent",
                        border: isCurrent ? "1px solid var(--yellow-border)" : "1px solid transparent",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          backgroundColor: isDone ? "var(--yellow-primary)" : isCurrent ? "var(--yellow-muted)" : "var(--bg-secondary)",
                          color: isDone ? "#0A0A0A" : isCurrent ? "var(--yellow-primary)" : "var(--text-muted)",
                          border: isCurrent ? "1px solid var(--yellow-primary)" : "1px solid var(--border-color)",
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? "\u2713" : idx + 1}
                      </div>
                      <div>
                        <strong
                          style={{
                            fontSize: "0.95rem",
                            color: isCurrent ? "var(--yellow-primary)" : isDone ? "var(--text-primary)" : "var(--text-muted)",
                          }}
                        >
                          {step.title}
                        </strong>
                        <div className="text-xs text-secondary" style={{ marginTop: "2px" }}>
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-muted">
                Synthesizing with Gemini learning-science models... takes only a few seconds.
              </div>
            </div>
          ) : (
            /* STATE 3: GOAL CREATION FORM */
            <div className="card card-highlight">
              <div style={{ marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Instant AI Planner</span>
                <h2 style={{ fontSize: "1.8rem", margin: "4px 0" }}>Create Your 30-Day Goal</h2>
                <p style={{ margin: 0 }}>Provide your authentic constraints. Our AI synthesizes your timetable immediately in front of you.</p>
              </div>

              <form onSubmit={submitGoal}>
                {/* 1. Goal Description */}
                <div className="form-group">
                  <label htmlFor="goal">
                    Goal Title or Target Achievement <span style={{ color: "var(--yellow-primary)" }}>*</span>
                    <span className="hint">(e.g. Master German for B2 certification, Build a production AI SaaS, Pass AWS Solutions Architect)</span>
                  </label>
                  <input
                    id="goal"
                    type="text"
                    required
                    placeholder="What specific skill or outcome are you targeting?"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  />
                </div>

                {/* 2. Goal Category */}
                <div className="form-group">
                  <label htmlFor="category">
                    Goal Category <span style={{ color: "var(--yellow-primary)" }}>*</span>
                    <span className="hint">(Configures appropriate skill benchmarks)</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {GOAL_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Language Field */}
                {activeCategoryConfig.hasLanguageField && (
                  <div className="form-group">
                    <label htmlFor="language">
                      Target Language <span style={{ color: "var(--yellow-primary)" }}>*</span>
                    </label>
                    <input
                      id="language"
                      type="text"
                      placeholder="e.g. German, Japanese, Spanish, Mandarin"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      required
                    />
                  </div>
                )}

                {/* 3. Current & Target Levels */}
                <div className="grid-2">
                  <div className="form-group">
                    <label htmlFor="currentLevel">
                      Current Starting Level <span style={{ color: "var(--yellow-primary)" }}>*</span>
                    </label>
                    <select
                      id="currentLevel"
                      value={currentLevel}
                      onChange={(e) => setCurrentLevel(e.target.value)}
                    >
                      {activeCategoryConfig.levels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                    {currentLevel === "custom" && (
                      <input
                        type="text"
                        style={{ marginTop: "6px" }}
                        placeholder="Specify your custom starting level"
                        value={customCurrentLevel}
                        onChange={(e) => setCustomCurrentLevel(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="targetLevel">
                      Target 30-Day Milestone Level <span style={{ color: "var(--yellow-primary)" }}>*</span>
                    </label>
                    <select
                      id="targetLevel"
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value)}
                    >
                      {activeCategoryConfig.levels.map((lvl) => (
                        <option key={lvl.id} value={lvl.id}>
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                    {targetLevel === "custom" && (
                      <input
                        type="text"
                        style={{ marginTop: "6px" }}
                        placeholder="Specify your custom target milestone"
                        value={customTargetLevel}
                        onChange={(e) => setCustomTargetLevel(e.target.value)}
                        required
                      />
                    )}
                  </div>
                </div>

                {/* Conditional Score Fields for Education & Exams */}
                {activeCategoryConfig.hasScoreFields && (
                  <div className="grid-2">
                    <div className="form-group">
                      <label htmlFor="currentScore">Current Score / Practice Percentile</label>
                      <input
                        id="currentScore"
                        type="text"
                        placeholder="e.g. 580 / 800 or 65%"
                        value={currentScore}
                        onChange={(e) => setCurrentScore(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="targetScore">Target Score / Target Percentile</label>
                      <input
                        id="targetScore"
                        type="text"
                        placeholder="e.g. 750 / 800 or 95th percentile"
                        value={targetScore}
                        onChange={(e) => setTargetScore(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Daily Hours & Focus Window */}
                <div className="grid-2">
                  <div className="form-group">
                    <label htmlFor="hours">
                      Available Daily Hours <span style={{ color: "var(--yellow-primary)" }}>*</span>
                    </label>
                    <input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="16"
                      required
                      value={hours}
                      onChange={(e) => setHours(parseFloat(e.target.value) || 0.5)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="focus">
                      Peak Cognitive Focus Window <span style={{ color: "var(--yellow-primary)" }}>*</span>
                    </label>
                    <select
                      id="focus"
                      value={focus}
                      onChange={(e) => setFocus(e.target.value as any)}
                    >
                      <option value="morning">Morning (06:00 &ndash; 11:00)</option>
                      <option value="afternoon">Afternoon (12:00 &ndash; 17:00)</option>
                      <option value="evening">Evening (17:00 &ndash; 21:00)</option>
                      <option value="night">Night (21:00 &ndash; 01:00)</option>
                    </select>
                  </div>
                </div>

                {/* 5. Deadline & Timezone */}
                <div className="grid-2">
                  <div className="form-group">
                    <label htmlFor="deadline">Target Deadline (Optional)</label>
                    <input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="timezone">Your Timezone</label>
                    <input
                      id="timezone"
                      type="text"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* 6. Fixed Commitments */}
                <div className="form-group">
                  <label htmlFor="fixed">
                    Fixed Commitments
                    <span className="hint">(Work hours, school, family obligations, commuting)</span>
                  </label>
                  <textarea
                    id="fixed"
                    rows={2}
                    placeholder="e.g. Work 9am-5pm Mon-Fri, gym on Tue/Thu evenings."
                    value={fixed}
                    onChange={(e) => setFixed(e.target.value)}
                  />
                </div>

                {/* 7. Known Distractions */}
                <div className="form-group">
                  <label htmlFor="distractions">
                    Known Distractions &amp; Triggers
                    <span className="hint">(What usually derails your study flow?)</span>
                  </label>
                  <textarea
                    id="distractions"
                    rows={2}
                    placeholder="e.g. Phone notifications, YouTube rabbit holes, fatigue after 4pm."
                    value={distractions}
                    onChange={(e) => setDistractions(e.target.value)}
                  />
                </div>

                {/* 8. Previous Attempts */}
                <div className="form-group">
                  <label htmlFor="previous">
                    Previous Attempts &amp; Pain Points
                    <span className="hint">(What did you try before and why did it stall?)</span>
                  </label>
                  <textarea
                    id="previous"
                    rows={2}
                    placeholder="e.g. Tried learning 2 months ago but got overwhelmed by grammar rules and stopped."
                    value={previous}
                    onChange={(e) => setPrevious(e.target.value)}
                  />
                </div>

                {/* 9. Additional Constraints */}
                <div className="form-group">
                  <label htmlFor="constraints">
                    Additional Notes or Constraints
                    <span className="hint">(Special equipment, materials, physical constraints)</span>
                  </label>
                  <textarea
                    id="constraints"
                    rows={2}
                    placeholder="e.g. Only have a laptop; prefer visual diagrams and coding exercises over passive reading."
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                  />
                </div>

                {err && <div className="alert alert-error">{err}</div>}

                <button
                  type="submit"
                  disabled={busy}
                  className="btn btn-primary"
                  style={{ width: "100%", fontSize: "1.05rem" }}
                >
                  Synthesize My 30-Day Timetable with AI &rarr;
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* REQUEST LOOKUP SECTION */}
      <section id="lookup" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "50px" }}>
        <div className="container-narrow text-center" style={{ textAlign: "center" }}>
          <h2>Check Existing Goal Request</h2>
          <p>Already submitted a goal? Enter your Access Code (e.g. AM-A1B2C3D4E5F60718) or Request ID to open your dashboard.</p>

          <div style={{ display: "flex", gap: "10px", maxWidth: "480px", margin: "20px auto 0" }}>
            <input
              type="text"
              placeholder="e.g. AM-A1B2C3D4E5F60718"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              style={{ fontFamily: "monospace", textTransform: "uppercase" }}
            />
            <Link
              href={lookupCode ? `/goal/${lookupCode.trim()}` : "#"}
              className={`btn btn-secondary ${!lookupCode ? "disabled" : ""}`}
              style={{ whiteSpace: "nowrap" }}
            >
              Open Goal
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
