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

  // Submission state
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [createdRequest, setCreatedRequest] = useState<{ id: string; requestCode: string } | null>(null);

  // Auto-detect timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch {
      // Default to UTC
    }
  }, []);

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
        throw new Error(data.error || "Failed to create goal request.");
      }

      setCreatedRequest({
        id: data.id,
        requestCode: data.request_code,
      });
    } catch (e: any) {
      setErr(e.message || "An unexpected error occurred. Please check your connection.");
    } finally {
      setBusy(false);
    }
  }

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
          Learning Science &bull; Behavioral Accountability &bull; Google Gemini
        </div>

        <h1 style={{ fontSize: "2.8rem", maxWidth: "860px", margin: "0 auto 20px" }}>
          Don't plan a perfect day. <br />
          <span style={{ color: "var(--yellow-primary)" }}>Build a system that learns your real one.</span>
        </h1>

        <p style={{ fontSize: "1.2rem", maxWidth: "700px", margin: "0 auto 32px", color: "var(--text-secondary)" }}>
          AuraMind is a research-first AI accountability platform. We research your goal, engineer a personalized 30-day timetable, and adapt your schedule based on what actually happens in reality.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <a href="#create-goal" className="btn btn-primary btn-lg">
            Start Your Goal
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
            <h3>Deep Research</h3>
            <p className="text-sm">We analyze prerequisites, skill acquisition stages, and common failure modes for your specific starting level.</p>
          </div>
          <div className="card card-highlight">
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--yellow-primary)", marginBottom: "8px" }}>02</div>
            <h3>Personalized Plan</h3>
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
              <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Curriculum Preview</span>
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

      {/* GOAL CREATION FORM */}
      <section id="create-goal" style={{ marginBottom: "80px" }}>
        <div className="container-narrow">
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
                  margin: "0 auto 20px",
                }}
              >
                &#10003;
              </div>

              <h2 style={{ fontSize: "1.8rem", marginBottom: "12px" }}>Goal Request Submitted!</h2>
              <p style={{ maxWidth: "540px", margin: "0 auto 24px" }}>
                Your goal has been successfully queued for expert learning-science research and timetable synthesis.
              </p>

              <div
                style={{
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--yellow-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px",
                  marginBottom: "24px",
                  display: "inline-block",
                }}
              >
                <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                  Your Unique Request Code
                </div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--yellow-primary)", fontFamily: "monospace" }}>
                  {createdRequest.requestCode}
                </div>
              </div>

              <div className="alert alert-info" style={{ textAlign: "left", maxWidth: "560px", margin: "0 auto 24px" }}>
                <div>
                  <strong>Important Notice:</strong> Our structured research and curriculum verification process can take up to <strong>12 hours</strong>. Please save your Request Code or bookmark your goal page.
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={`/goal/${createdRequest.id}`} className="btn btn-primary">
                  View Goal Status Page &rarr;
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setCreatedRequest(null);
                    setGoal("");
                  }}
                >
                  Submit Another Goal
                </button>
              </div>
            </div>
          ) : (
            <div className="card card-highlight">
              <div style={{ marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Step 1 of 2</span>
                <h2 style={{ fontSize: "1.8rem", margin: "4px 0" }}>Create Your 30-Day Goal</h2>
                <p style={{ margin: 0 }}>Provide your authentic constraints. We engineer a plan tailored to your actual life.</p>
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
                  {busy ? "Submitting to Research Queue…" : "Submit Goal for Research &amp; 30-Day Plan &rarr;"}
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
          <p>Already submitted a goal? Enter your Request Code (e.g. AM-A1B2C3D4E5F60718) or Request ID to check status.</p>

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
              Track Status
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
