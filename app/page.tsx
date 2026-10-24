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

  // Multi-step onboarding state (Steps 1 to 5)
  const [formStep, setFormStep] = useState(1);

  // Interactive Product Preview Tab State
  const [previewTab, setPreviewTab] = useState<"timetable" | "timer" | "checkin" | "ai">("timetable");
  const [previewTimerSec, setPreviewTimerSec] = useState(25 * 60);
  const [previewTimerActive, setPreviewTimerActive] = useState(false);

  // Request lookup state
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
  const [copiedCode, setCopiedCode] = useState(false);

  // Auto-detect timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      // Default to UTC
    }
  }, []);

  // Mini timer runner for interactive hero preview
  useEffect(() => {
    let interval: any;
    if (previewTimerActive) {
      interval = setInterval(() => {
        setPreviewTimerSec((prev) => (prev > 0 ? prev - 1 : 25 * 60));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [previewTimerActive]);

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

  async function submitGoal(e?: React.FormEvent) {
    if (e) e.preventDefault();
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

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const GEN_STEPS = [
    { title: "Analyzing Cognitive Baseline", desc: `Calibrating ${hours}h daily budget inside your peak ${focus} window.` },
    { title: "Synthesizing Goal Intelligence Blueprint", desc: "Isolating domain-specific workstreams, dependencies, and milestones." },
    { title: "Architecting 30-Day Execution Timetable", desc: "Constructing daily deliberate practice blocks with actionable criteria." },
    { title: "Running Personalization Quality Control Audit", desc: "Checking feasibility, eliminating generic filler, and verifying alignment." },
  ];

  const formatTimerDigits = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="futuristic-rings-container" style={{ paddingTop: "80px", paddingBottom: "72px" }}>
        <div className="futuristic-rings" style={{ top: "25%", left: "75%", opacity: 0.6 }} aria-hidden="true" />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "820px", marginBottom: "48px" }}>
            <div
              className="badge badge-yellow"
              style={{
                marginBottom: "20px",
                padding: "6px 12px",
                fontSize: "0.8rem",
              }}
            >
              <span className="badge-dot" />
              <span>Cognitive Architecture &bull; Behavioral Accountability &bull; Instant Synthesis</span>
            </div>

            <h1 className="display-title" style={{ marginBottom: "20px" }}>
              Your goals deserve more than a to-do list.
            </h1>

            <p className="lead" style={{ maxWidth: "680px", marginBottom: "36px" }}>
              AuraMind turns your ambitions into personalized action plans, tracks your progress, and adapts when life doesn&rsquo;t go according to plan.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "center" }}>
              <a href="#create-goal" className="btn btn-primary btn-lg">
                Start Your Goal &rarr;
              </a>
              <a href="#product-preview" className="btn btn-secondary btn-lg">
                Explore AuraMind
              </a>
            </div>
          </div>

          {/* REAL APPLICATION DEMONSTRATION WORKSPACE */}
          <div id="product-preview" className="surface-elevated" style={{ padding: "0", overflow: "hidden" }}>
            {/* Top Workspace Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid var(--border-default)",
                backgroundColor: "var(--bg-secondary)",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="badge badge-yellow">Live Preview</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Goal: Full-Stack Cloud Architecture &amp; Python Services
                </span>
                <span className="text-xs text-muted" style={{ display: "inline-block" }}>
                  Day 1 of 30 &bull; Foundation Phase
                </span>
              </div>

              {/* Workspace Navigation Tabs */}
              <div className="tabs-nav" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`tabs-nav-btn ${previewTab === "timetable" ? "active" : ""}`}
                  onClick={() => setPreviewTab("timetable")}
                >
                  Timetable
                </button>
                <button
                  type="button"
                  className={`tabs-nav-btn ${previewTab === "timer" ? "active" : ""}`}
                  onClick={() => setPreviewTab("timer")}
                >
                  Focus Timer
                </button>
                <button
                  type="button"
                  className={`tabs-nav-btn ${previewTab === "checkin" ? "active" : ""}`}
                  onClick={() => setPreviewTab("checkin")}
                >
                  Hourly Check-in
                </button>
                <button
                  type="button"
                  className={`tabs-nav-btn ${previewTab === "ai" ? "active" : ""}`}
                  onClick={() => setPreviewTab("ai")}
                >
                  Ask AuraMind
                </button>
              </div>
            </div>

            {/* Preview Tab Contents */}
            <div style={{ padding: "24px" }}>
              {previewTab === "timetable" && (
                <div>
                  <div className="flex-between" style={{ marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Today&rsquo;s Scheduled Blocks &bull; Day 1</h3>
                      <p style={{ margin: "2px 0 0", fontSize: "0.825rem" }}>
                        Hardest deliberate cognitive load scheduled inside your 07:00 &ndash; 11:00 morning focus window.
                      </p>
                    </div>
                    <span className="badge badge-neutral">3 Blocks &bull; 2.5h Total</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div className="task-item active-current priority-high">
                      <div className="flex-between" style={{ marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="font-mono text-xs text-yellow font-bold">07:00 &ndash; 07:50</span>
                          <span className="badge badge-yellow">Learn &bull; High Priority</span>
                          <span className="badge badge-success" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>In Progress</span>
                        </div>
                        <span className="text-xs text-muted">50m duration</span>
                      </div>
                      <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        Core Runtime Mechanics: Event Loops &amp; Memory Models
                      </strong>
                      <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                        Pedagogical goal: Construct mental models of async execution before writing complex distributed code.
                      </div>
                    </div>

                    <div className="task-item priority-medium">
                      <div className="flex-between" style={{ marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="font-mono text-xs text-secondary font-bold">08:00 &ndash; 08:50</span>
                          <span className="badge badge-neutral">Practice &bull; Medium Priority</span>
                        </div>
                        <span className="text-xs text-muted">50m duration</span>
                      </div>
                      <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        Guided Implementation Drills: Concurrency Benchmarking
                      </strong>
                      <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                        Immediate active practice to wire neural pathways through deliberate coding rather than passive reading.
                      </div>
                    </div>

                    <div className="task-item priority-low">
                      <div className="flex-between" style={{ marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className="font-mono text-xs text-muted font-bold">09:00 &ndash; 09:30</span>
                          <span className="badge badge-neutral">Review &bull; Low Priority</span>
                        </div>
                        <span className="text-xs text-muted">30m duration</span>
                      </div>
                      <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        Active Retrieval &amp; Check-In Reflection
                      </strong>
                      <div className="text-xs text-secondary" style={{ marginTop: "4px" }}>
                        Explain concepts without notes to verify retention and diagnose cognitive fatigue.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {previewTab === "timer" && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <span className="badge badge-yellow" style={{ marginBottom: "12px" }}>
                    Active Sprint: Core Runtime Mechanics
                  </span>
                  <div
                    className="font-mono font-bold"
                    style={{
                      fontSize: "4.2rem",
                      letterSpacing: "-0.04em",
                      color: previewTimerActive ? "var(--accent-primary)" : "var(--text-primary)",
                      marginBottom: "16px",
                      lineHeight: 1,
                    }}
                  >
                    {formatTimerDigits(previewTimerSec)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "16px" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => setPreviewTimerActive(!previewTimerActive)}
                    >
                      {previewTimerActive ? "Pause Sprint" : "Start Sprint"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setPreviewTimerActive(false);
                        setPreviewTimerSec(25 * 60);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  <p className="text-xs text-muted" style={{ margin: 0 }}>
                    Calm, telemetry-tracked focus sprint. Completed sessions automatically award XP and update daily metrics.
                  </p>
                </div>
              )}

              {previewTab === "checkin" && (
                <div>
                  <div className="flex-between" style={{ marginBottom: "14px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Hourly Check-in &bull; Session Verification</h3>
                    <span className="badge badge-neutral">Signal, Not Shame</span>
                  </div>
                  <div className="surface" style={{ padding: "16px", backgroundColor: "var(--bg-secondary)" }}>
                    <div className="grid-2" style={{ marginBottom: "12px" }}>
                      <div>
                        <div className="text-xs text-muted">Planned Task</div>
                        <strong style={{ fontSize: "0.875rem" }}>07:00 &ndash; 07:50: Core Runtime Mechanics</strong>
                      </div>
                      <div>
                        <div className="text-xs text-muted">Verified Execution</div>
                        <span className="badge badge-success">Completed &bull; 45m Focused / 5m Friction</span>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "10px" }}>
                      <div className="text-xs text-yellow" style={{ fontWeight: 600, marginBottom: "2px" }}>
                        AuraMind Cognitive Telemetry:
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        &ldquo;High retention observed. The 5-minute break prevented fatigue accumulation before Block 2.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {previewTab === "ai" && (
                <div>
                  <div className="flex-between" style={{ marginBottom: "12px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Ask AuraMind &bull; Live Technical Tutor</h3>
                    <span className="badge badge-yellow">Context-Aware AI</span>
                  </div>
                  <div className="surface" style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", marginBottom: "10px" }}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-primary)" }}>AuraMind AI:</span>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                        &ldquo;For today&rsquo;s Block 1 on Python decorators, remember the golden rule: a decorator is a function returning another callable. Avoid modifying internal function signatures unless you preserve <code>*args, **kwargs</code> with <code>@functools.wraps</code>.&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted">
                    Connected to Google Gemini learning-science models. Integrated with your live schedule and check-in history.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 7 CORE ARCHITECTURAL PILLARS - BENTO 2-3-2 ARCHITECTURE */}
      <section className="futuristic-rings-container" style={{ padding: "96px 0", borderTop: "1px solid var(--border-default)" }}>
        <div className="futuristic-rings" aria-hidden="true" />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: "780px", marginBottom: "56px" }}>
            <div className="badge badge-yellow" style={{ marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <span className="badge-dot" />
              <span>System Architecture</span>
            </div>
            <h2 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "16px", color: "var(--text-primary)" }}>
              Engineered for Sustained Progress
            </h2>
            <p className="lead" style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "700px" }}>
              Traditional goal systems collapse because they rely on unbroken willpower. AuraMind treats missed sessions as diagnostic data to recalibrate your schedule.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Bento Row 1: 2 Columns */}
            <div className="bento-row-2" style={{ margin: 0 }}>
              <div className="bento-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span className="bento-card-tag" style={{ margin: 0 }}>01 / DIAGNOSTIC RESEARCH</span>
                    <div className="dot-matrix" aria-hidden="true">
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                    <div className="bento-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                    </div>
                    <h3 className="bento-card-title" style={{ margin: "4px 0 0" }}>Prerequisites &amp; Failure Modes</h3>
                  </div>
                </div>
                <p className="bento-card-desc" style={{ margin: 0 }}>
                  Before writing a schedule, AuraMind analyzes the specific progression curve from your current baseline to your target standard, mapping common drop-off points and cognitive bottlenecks.
                </p>
              </div>

              <div className="bento-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span className="bento-card-tag" style={{ margin: 0 }}>02 / 30-DAY TIMETABLE</span>
                    <div className="dot-matrix" aria-hidden="true">
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                    <div className="bento-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                      </svg>
                    </div>
                    <h3 className="bento-card-title" style={{ margin: "4px 0 0" }}>Deliberate Practice Architecture</h3>
                  </div>
                </div>
                <p className="bento-card-desc" style={{ margin: 0 }}>
                  Generates an exact 30-day curriculum divided into 4 structured phases: Foundation, Deliberate Practice, Real-world Application, and Consolidation, respecting your peak focus windows.
                </p>
              </div>
            </div>

            {/* Bento Row 2: 3 Columns */}
            <div className="bento-row-3" style={{ margin: 0 }}>
              <div className="bento-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span className="bento-card-tag" style={{ margin: 0 }}>03 / FOCUS WORKSPACE</span>
                    <div className="dot-matrix" aria-hidden="true">
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                    <div className="bento-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="13" r="8" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="13" x2="15" y2="15" />
                        <path d="M12 2v3M9 2h6" />
                      </svg>
                    </div>
                    <h3 className="bento-card-title" style={{ margin: "4px 0 0" }}>Dedicated Telemetry Timer</h3>
                  </div>
                </div>
                <p className="bento-card-desc" style={{ margin: 0 }}>
                  Distraction-free focus timer supporting 25m, 50m, 90m, and custom intervals. Tracks deep-work duration and awards XP upon completion.
                </p>
              </div>

              <div className="bento-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span className="bento-card-tag" style={{ margin: 0 }}>04 / HOURLY LOGS</span>
                    <div className="dot-matrix" aria-hidden="true">
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                    <div className="bento-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <path d="M9 14l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="bento-card-title" style={{ margin: "4px 0 0" }}>Friction Signal Capture</h3>
                  </div>
                </div>
                <p className="bento-card-desc" style={{ margin: 0 }}>
                  Log what actually happened. If fatigue or distractions derailed a block, AuraMind records the diagnostic cause to adjust subsequent workload.
                </p>
              </div>

              <div className="bento-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span className="bento-card-tag" style={{ margin: 0 }}>05 / AI COACHING</span>
                    <div className="dot-matrix" aria-hidden="true">
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                    <div className="bento-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a4 4 0 0 1 4 4c0 1.25-.57 2.37-1.47 3.1A7.002 7.002 0 0 1 19 16v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-1a7.002 7.002 0 0 1 4.47-6.9A4.002 4.002 0 0 1 8 6a4 4 0 0 1 4-4z" />
                        <path d="M9 12h6M12 9v6" />
                      </svg>
                    </div>
                    <h3 className="bento-card-title" style={{ margin: "4px 0 0" }}>Gemini Context Assistant</h3>
                  </div>
                </div>
                <p className="bento-card-desc" style={{ margin: 0 }}>
                  Ask questions anytime. Your AI assistant has full access to your timetable, notes, and check-in history to provide targeted mental models and code examples.
                </p>
              </div>
            </div>

            {/* Bento Row 3: 2 Columns */}
            <div className="bento-row-2" style={{ margin: 0 }}>
              <div className="bento-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span className="bento-card-tag" style={{ margin: 0 }}>06 / ANALYTICS</span>
                    <div className="dot-matrix" aria-hidden="true">
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                    <div className="bento-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                        <path d="M4 20h16" />
                      </svg>
                    </div>
                    <h3 className="bento-card-title" style={{ margin: "4px 0 0" }}>Behavioral Velocity &amp; Insights</h3>
                  </div>
                </div>
                <p className="bento-card-desc" style={{ margin: 0 }}>
                  Real metrics calculate focus vs resistance ratios, identifying your strongest cognitive time of day and your most frequent blocker.
                </p>
              </div>

              <div className="bento-card">
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                    <span className="bento-card-tag" style={{ margin: 0 }}>07 / RECALIBRATION</span>
                    <div className="dot-matrix" aria-hidden="true">
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                      <span className="dot-matrix-dot" />
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                    <div className="bento-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6" />
                        <path d="M22 11.5A10 10 0 0 0 3.2 7.2L2.5 8M2 12.5a10 10 0 0 0 18.8 4.3l.7.7" />
                      </svg>
                    </div>
                    <h3 className="bento-card-title" style={{ margin: "4px 0 0" }}>Adaptive 7-Day Restructuring</h3>
                  </div>
                </div>
                <p className="bento-card-desc" style={{ margin: 0 }}>
                  On Day 7, 14, and 21, the system generates evidence-based schedule adaptations to keep you progressing when unforeseen friction arises.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MULTI-STEP GOAL ONBOARDING EXPERIENCE */}
      <section id="create-goal" style={{ padding: "80px 0", borderTop: "1px solid var(--border-subtle)" }}>
        <div className="container-narrow">
          {/* STATE 1: INSTANT TIMETABLE READY */}
          {createdRequest ? (
            <div className="surface-accent" style={{ padding: "36px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span className="badge badge-success">
                  <span className="badge-dot" />
                  Synthesis Complete
                </span>
                <span className="text-xs text-muted">Ready in memory &amp; saved to database</span>
              </div>

              <h2 style={{ fontSize: "1.9rem", marginBottom: "8px" }}>Your 30-Day Timetable is Ready</h2>
              <p style={{ marginBottom: "24px" }}>
                AuraMind has researched your learning trajectory, resolved common bottlenecks, and structured an exact day-by-day plan calibrated to your real availability.
              </p>

              {/* ACCESS CODE CARD */}
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  padding: "16px 20px",
                  marginBottom: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>
                    Your Persistent Access Code
                  </div>
                  <div className="font-mono" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                    {createdRequest.requestCode}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => copyCodeToClipboard(createdRequest.requestCode)}
                >
                  {copiedCode ? "Copied!" : "Copy Access Code"}
                </button>
              </div>

              {/* ROADMAP OVERVIEW */}
              {createdRequest.plan && (
                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Executive Curriculum Summary:
                  </div>
                  <div className="surface" style={{ padding: "16px", backgroundColor: "var(--bg-secondary)", marginBottom: "16px" }}>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      {createdRequest.plan.goal_summary}
                    </p>
                  </div>

                  <div className="grid-2" style={{ gap: "10px" }}>
                    {createdRequest.plan.weekly_focus?.map((wf: any) => (
                      <div
                        key={wf.week}
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          padding: "12px 14px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <strong style={{ fontSize: "0.85rem", color: "var(--accent-primary)" }}>
                          Week {wf.week}: {wf.title}
                        </strong>
                        <div className="text-xs text-secondary" style={{ marginTop: "3px" }}>
                          {wf.expected_outcome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  disabled={isStartingDirectly}
                  onClick={() => launchDay1Now(createdRequest.id)}
                  style={{ minWidth: "200px" }}
                >
                  {isStartingDirectly ? "Opening Workspace..." : "Start Day 1 Now \u2192"}
                </button>
                <Link href={`/goal/${createdRequest.id}`} className="btn btn-secondary btn-lg">
                  Inspect Full Schedule
                </Link>
                <button
                  type="button"
                  className="btn btn-ghost btn-lg"
                  onClick={() => {
                    setCreatedRequest(null);
                    setGoal("");
                    setFormStep(1);
                  }}
                >
                  Create Another Goal
                </button>
              </div>
            </div>
          ) : busy ? (
            /* STATE 2: SYNTHESIS IN PROGRESS */
            <div className="surface-accent" style={{ padding: "40px 28px", textAlign: "center" }}>
              <span className="badge badge-yellow pulse" style={{ marginBottom: "16px" }}>
                AI Synthesis Active
              </span>

              <h2 style={{ fontSize: "1.9rem", marginBottom: "8px" }}>Engineering Your 30-Day Timetable</h2>
              <p style={{ maxWidth: "540px", margin: "0 auto 28px" }}>
                Analyzing baseline, sequencing deliberate practice blocks, and calculating cognitive recovery windows.
              </p>

              {/* Step Telemetry */}
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
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "8px",
                        backgroundColor: isCurrent ? "var(--bg-elevated)" : "transparent",
                        border: isCurrent ? "1px solid var(--accent-border)" : "1px solid transparent",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          backgroundColor: isDone ? "var(--accent-primary)" : isCurrent ? "var(--accent-muted)" : "var(--bg-secondary)",
                          color: isDone ? "#0A0A0A" : isCurrent ? "var(--accent-primary)" : "var(--text-muted)",
                          border: isCurrent ? "1px solid var(--accent-primary)" : "1px solid var(--border-default)",
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? "\u2713" : idx + 1}
                      </div>
                      <div>
                        <strong
                          style={{
                            fontSize: "0.9rem",
                            color: isCurrent ? "var(--accent-primary)" : isDone ? "var(--text-primary)" : "var(--text-muted)",
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
                Connecting with Gemini learning-science models... takes only a few seconds.
              </div>
            </div>
          ) : (
            /* STATE 3: MULTI-STEP GOAL CREATION WIZARD */
            <div className="surface" style={{ padding: "32px 28px" }}>
              {/* Header & Step Bar */}
              <div style={{ marginBottom: "28px" }}>
                <div className="flex-between" style={{ marginBottom: "8px", flexWrap: "wrap" }}>
                  <div>
                    <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>Goal Setup Wizard</span>
                    <h2 style={{ fontSize: "1.75rem", margin: 0 }}>Plan Your 30-Day Trajectory</h2>
                  </div>
                  <span className="text-xs font-mono text-muted">
                    Step {formStep} of 5
                  </span>
                </div>

                {/* Step Progress Line */}
                <div style={{ display: "flex", gap: "6px", marginTop: "16px" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      onClick={() => {
                        if (goal.trim().length > 0 || s === 1) setFormStep(s);
                      }}
                      style={{
                        flex: 1,
                        height: "4px",
                        borderRadius: "2px",
                        backgroundColor: s <= formStep ? "var(--accent-primary)" : "var(--border-default)",
                        cursor: goal.trim().length > 0 ? "pointer" : "default",
                        transition: "background-color var(--transition-fast)",
                      }}
                    />
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                {/* STEP 1: DEFINE YOUR GOAL */}
                {formStep === 1 && (
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Step 1: Define Your Target Outcome</h3>
                      <p className="text-sm">What specific competency, certificate, or project do you want to accomplish?</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="goal">
                        Goal Statement <span style={{ color: "var(--accent-primary)" }}>*</span>
                        <span className="form-hint">(Be specific and measurable)</span>
                      </label>
                      <input
                        id="goal"
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. Master Python async services and build a production API"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="category">
                        Domain Category <span style={{ color: "var(--accent-primary)" }}>*</span>
                        <span className="form-hint">(Selects appropriate evaluation benchmarks)</span>
                      </label>
                      <select
                        id="category"
                        className="form-select"
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

                    {activeCategoryConfig.hasLanguageField && (
                      <div className="form-group">
                        <label className="form-label" htmlFor="language">
                          Target Language <span style={{ color: "var(--accent-primary)" }}>*</span>
                        </label>
                        <input
                          id="language"
                          type="text"
                          className="form-input"
                          placeholder="e.g. German, Japanese, Spanish, French"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label" htmlFor="deadline">
                        Target Completion Date <span className="form-hint">(Optional)</span>
                      </label>
                      <input
                        id="deadline"
                        type="date"
                        className="form-input"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={!goal.trim()}
                        onClick={() => setFormStep(2)}
                      >
                        Continue to Step 2 &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: STARTING POINT & BENCHMARKS */}
                {formStep === 2 && (
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Step 2: Calibrate Starting Point &amp; Milestone</h3>
                      <p className="text-sm">Accurate levels ensure the timetable is neither overwhelming nor under-stimulating.</p>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label" htmlFor="currentLevel">
                          Current Starting Level <span style={{ color: "var(--accent-primary)" }}>*</span>
                        </label>
                        <select
                          id="currentLevel"
                          className="form-select"
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
                            className="form-input"
                            style={{ marginTop: "6px" }}
                            placeholder="Specify current capability"
                            value={customCurrentLevel}
                            onChange={(e) => setCustomCurrentLevel(e.target.value)}
                          />
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="targetLevel">
                          30-Day Target Milestone <span style={{ color: "var(--accent-primary)" }}>*</span>
                        </label>
                        <select
                          id="targetLevel"
                          className="form-select"
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
                            className="form-input"
                            style={{ marginTop: "6px" }}
                            placeholder="Specify target milestone"
                            value={customTargetLevel}
                            onChange={(e) => setCustomTargetLevel(e.target.value)}
                          />
                        )}
                      </div>
                    </div>

                    {activeCategoryConfig.hasScoreFields && (
                      <div className="grid-2">
                        <div className="form-group">
                          <label className="form-label" htmlFor="currentScore">Current Score / Practice Percentile</label>
                          <input
                            id="currentScore"
                            type="text"
                            className="form-input"
                            placeholder="e.g. 580 / 800 or 65%"
                            value={currentScore}
                            onChange={(e) => setCurrentScore(e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label" htmlFor="targetScore">Target Score / Milestone</label>
                          <input
                            id="targetScore"
                            type="text"
                            className="form-input"
                            placeholder="e.g. 750 / 800 or 95th percentile"
                            value={targetScore}
                            onChange={(e) => setTargetScore(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setFormStep(1)}>
                        &larr; Back
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => setFormStep(3)}>
                        Continue to Step 3 &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: AVAILABILITY & FOCUS WINDOW */}
                {formStep === 3 && (
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Step 3: Define Real Time Availability</h3>
                      <p className="text-sm">Hardest cognitive work will be placed strictly inside your designated energy window.</p>
                    </div>

                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label" htmlFor="hours">
                          Available Daily Hours <span style={{ color: "var(--accent-primary)" }}>*</span>
                        </label>
                        <input
                          id="hours"
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="16"
                          className="form-input"
                          value={hours}
                          onChange={(e) => setHours(parseFloat(e.target.value) || 0.5)}
                        />
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          {[1.5, 2.0, 2.5, 3.5, 4.0].map((h) => (
                            <button
                              key={h}
                              type="button"
                              className={`btn btn-sm ${hours === h ? "btn-primary" : "btn-secondary"}`}
                              style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                              onClick={() => setHours(h)}
                            >
                              {h}h
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="focus">
                          Peak Cognitive Energy Window <span style={{ color: "var(--accent-primary)" }}>*</span>
                        </label>
                        <select
                          id="focus"
                          className="form-select"
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

                    <div className="form-group">
                      <label className="form-label" htmlFor="timezone">
                        Your Timezone <span className="form-hint">(Detected automatically)</span>
                      </label>
                      <input
                        id="timezone"
                        type="text"
                        className="form-input font-mono"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setFormStep(2)}>
                        &larr; Back
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => setFormStep(4)}>
                        Continue to Step 4 &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: IDENTIFY CHALLENGES & FRICTION */}
                {formStep === 4 && (
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Step 4: Real-World Friction &amp; Constraints</h3>
                      <p className="text-sm">Knowing your authentic bottlenecks lets our AI engineer preventative recovery buffers.</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="fixed">
                        Fixed Commitments
                        <span className="form-hint">(Work hours, commuting, class schedules)</span>
                      </label>
                      <textarea
                        id="fixed"
                        className="form-textarea"
                        rows={2}
                        placeholder="e.g. Work 9am-5pm Mon-Fri, family dinner 7pm."
                        value={fixed}
                        onChange={(e) => setFixed(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="distractions">
                        Known Triggers &amp; Distractions
                        <span className="form-hint">(What usually derails your concentration?)</span>
                      </label>
                      <textarea
                        id="distractions"
                        className="form-textarea"
                        rows={2}
                        placeholder="e.g. Phone notifications, late-afternoon brain fog, opening social media when stuck."
                        value={distractions}
                        onChange={(e) => setDistractions(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="previous">
                        Previous Attempts &amp; Where They Stalled
                        <span className="form-hint">(What did you try before?)</span>
                      </label>
                      <textarea
                        id="previous"
                        className="form-textarea"
                        rows={2}
                        placeholder="e.g. Tried reading a textbook for 2 hours daily, burned out after Day 5."
                        value={previous}
                        onChange={(e) => setPrevious(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="constraints">
                        Additional Notes or Equipment Constraints
                      </label>
                      <textarea
                        id="constraints"
                        className="form-textarea"
                        rows={2}
                        placeholder="e.g. Prefer hands-on coding exercises over video lectures."
                        value={constraints}
                        onChange={(e) => setConstraints(e.target.value)}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setFormStep(3)}>
                        &larr; Back
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => setFormStep(5)}>
                        Review &amp; Synthesize &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: REVIEW & SYNTHESIZE */}
                {formStep === 5 && (
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "1.1rem", marginBottom: "4px" }}>Step 5: Review &amp; Execute AI Synthesis</h3>
                      <p className="text-sm">Verify your input parameters before generating your customized 30-day schedule.</p>
                    </div>

                    {/* Parameter Summary Box */}
                    <div className="surface" style={{ padding: "18px", backgroundColor: "var(--bg-secondary)", marginBottom: "20px" }}>
                      <div className="flex-between" style={{ marginBottom: "12px" }}>
                        <span className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>Configuration Summary</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFormStep(1)} style={{ padding: "2px 6px", fontSize: "0.75rem" }}>
                          Edit Settings
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.875rem" }}>
                        <div>
                          <span className="text-muted">Target Goal: </span>
                          <strong style={{ color: "var(--text-primary)" }}>{goal}</strong>
                        </div>
                        <div className="grid-2">
                          <div>
                            <span className="text-muted">Category: </span>
                            <span style={{ color: "var(--text-primary)" }}>{activeCategoryConfig.name}</span>
                          </div>
                          <div>
                            <span className="text-muted">Progression: </span>
                            <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
                              {currentLevel} &rarr; {targetLevel}
                            </span>
                          </div>
                        </div>
                        <div className="grid-2">
                          <div>
                            <span className="text-muted">Daily Time Budget: </span>
                            <span style={{ color: "var(--text-primary)" }}>{hours} hours / day</span>
                          </div>
                          <div>
                            <span className="text-muted">Cognitive Window: </span>
                            <span style={{ color: "var(--text-primary)", textTransform: "capitalize" }}>{focus}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {err && <div className="alert alert-error">{err}</div>}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "24px" }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setFormStep(4)}>
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-lg"
                        disabled={busy}
                        onClick={() => submitGoal()}
                        style={{ flex: 1, maxWidth: "340px" }}
                      >
                        Synthesize My 30-Day Timetable &rarr;
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </section>

      {/* 4. LOOKUP EXISTING REQUEST SECTION */}
      <section id="lookup" style={{ padding: "64px 0", borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-secondary)" }}>
        <div className="container-narrow text-center" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "8px" }}>Resume an Existing Goal</h2>
          <p style={{ maxWidth: "520px", margin: "0 auto 20px" }}>
            Enter your persistent Access Code (e.g. AM-A1B2C3D4E5F60718) or Request UUID to reopen your dashboard.
          </p>

          <div style={{ display: "flex", gap: "8px", maxWidth: "440px", margin: "0 auto" }}>
            <input
              type="text"
              className="form-input font-mono"
              placeholder="e.g. AM-A1B2C3D4E5F60718"
              value={lookupCode}
              onChange={(e) => setLookupCode(e.target.value)}
              style={{ textTransform: "uppercase" }}
            />
            <Link
              href={lookupCode ? `/goal/${lookupCode.trim()}` : "#"}
              className={`btn btn-primary ${!lookupCode ? "disabled" : ""}`}
              style={{ whiteSpace: "nowrap" }}
            >
              Open Workspace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
