"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatLevel } from "@/lib/categories";
import { REASON_LABELS } from "@/lib/analysis";

const REASONS = [
  "too_difficult",
  "did_not_understand",
  "tired",
  "phone",
  "social_media",
  "youtube",
  "gaming",
  "messaging",
  "unexpected_work",
  "family",
  "boredom",
  "environment",
  "other",
];

const TIMER_PRESETS = [
  { label: "25m Focus", minutes: 25 },
  { label: "50m Deep Work", minutes: 50 },
  { label: "90m Extended", minutes: 90 },
];

const BREAK_PRESETS = [
  { label: "5m Short Break", minutes: 5 },
  { label: "10m Break", minutes: 10 },
  { label: "15m Long Break", minutes: 15 },
];

export default function GoalHub() {
  const params = useParams<{ id: string }>();
  const idOrCode = params?.id || "";

  // Core Goal State
  const [goalData, setGoalData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"plan" | "timer" | "checkin" | "chat" | "reports" | "adaptive" | "xp">("plan");

  // Selected Day (defaults to calculated current day)
  const [selectedDay, setSelectedDay] = useState(1);

  // Focus Timer State
  const [timerDurationMin, setTimerDurationMin] = useState(25);
  const [customTimerMin, setCustomTimerMin] = useState("");
  const [timerRemainingSec, setTimerRemainingSec] = useState(25 * 60);
  const [timerStatus, setTimerStatus] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timerTask, setTimerTask] = useState("");
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [timerAlert, setTimerAlert] = useState("");
  const timerExpectedEndRef = useRef<number | null>(null);

  // Check-in State
  const [checkins, setCheckins] = useState<any[]>([]);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [checkinPlanned, setCheckinPlanned] = useState("");
  const [checkinActual, setCheckinActual] = useState("");
  const [checkinStatus, setCheckinStatus] = useState<"done" | "partial" | "missed" | "different">("done");
  const [checkinFocusedMin, setCheckinFocusedMin] = useState(45);
  const [checkinDistractionMin, setCheckinDistractionMin] = useState(5);
  const [checkinReason, setCheckinReason] = useState("");
  const [checkinDistractionType, setCheckinDistractionType] = useState("");
  const [checkinPeriod, setCheckinPeriod] = useState<"morning" | "afternoon" | "evening" | "night">("morning");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);
  const [coachingFeedback, setCoachingFeedback] = useState("");

  // Ask AuraMind Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);

  // Adaptive Schedule State
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptiveProposal, setAdaptiveProposal] = useState<any>(null);

  // Total XP & Stats
  const [userXp, setUserXp] = useState(50);

  // Load Goal Request
  const loadGoal = useCallback(async () => {
    if (!idOrCode) return;
    try {
      const res = await fetch(`/api/requests?id=${encodeURIComponent(idOrCode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Goal not found.");

      setGoalData(data);
      setErrorMsg("");

      // Calculate current day if started
      if (data.started_at) {
        const curDay = Math.min(30, Math.max(1, Math.floor((Date.now() - Date.parse(data.started_at)) / 864e5) + 1));
        setSelectedDay(curDay);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to load goal.");
    } finally {
      setIsLoading(false);
    }
  }, [idOrCode]);

  // Load Checkins & Analytics
  const loadCheckins = useCallback(async () => {
    if (!goalData?.id || !goalData?.started_at) return;
    try {
      const res = await fetch(`/api/checkin?id=${goalData.id}&day=${selectedDay}`);
      if (res.ok) {
        const data = await res.json();
        setCheckins(data.checkins || []);
        setDailyReport(data.daily);
        setWeeklyReport(data.weekly);
      }
    } catch {
      // Ignore background errors
    }
  }, [goalData?.id, goalData?.started_at, selectedDay]);

  // Load Chat History
  const loadChat = useCallback(async () => {
    if (!goalData?.id) return;
    try {
      const res = await fetch(`/api/chat?id=${goalData.id}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch {
      // Ignore
    }
  }, [goalData?.id]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  // Auto-poll if goal is not yet ready
  useEffect(() => {
    if (goalData && goalData.status !== "ready" && goalData.status !== "archived") {
      const interval = setInterval(loadGoal, 12000);
      return () => clearInterval(interval);
    }
  }, [goalData, loadGoal]);

  useEffect(() => {
    if (goalData?.started_at) {
      loadCheckins();
      loadChat();
    }
  }, [goalData?.started_at, loadCheckins, loadChat]);

  // Load / Restore Timer State from LocalStorage
  useEffect(() => {
    if (!goalData?.id) return;
    const storageKey = `auramind_timer_${goalData.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        setTimerDurationMin(state.durationMin || 25);
        setTimerTask(state.task || "");
        setTimerMode(state.mode || "focus");
        setCompletedSessionsCount(state.completedCount || 0);

        if (state.status === "running" && state.expectedEnd) {
          const remaining = Math.max(0, Math.round((state.expectedEnd - Date.now()) / 1000));
          if (remaining > 0) {
            setTimerRemainingSec(remaining);
            setTimerStatus("running");
            timerExpectedEndRef.current = state.expectedEnd;
          } else {
            setTimerRemainingSec(0);
            setTimerStatus("completed");
          }
        } else if (state.status === "paused") {
          setTimerRemainingSec(state.remainingSec || state.durationMin * 60);
          setTimerStatus("paused");
        } else {
          setTimerRemainingSec(state.durationMin * 60);
          setTimerStatus("idle");
        }
      } catch {
        // LocalStorage corrupted
      }
    }
  }, [goalData?.id]);

  // Save Timer State to LocalStorage
  const persistTimerState = (status: "idle" | "running" | "paused" | "completed", remSec: number, expEnd: number | null) => {
    if (!goalData?.id) return;
    const storageKey = `auramind_timer_${goalData.id}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        durationMin: timerDurationMin,
        remainingSec: remSec,
        status,
        mode: timerMode,
        task: timerTask,
        completedCount: completedSessionsCount,
        expectedEnd: expEnd,
      })
    );
  };

  // Timer Tick Mechanism (Accurate against sleep & inactive tabs)
  useEffect(() => {
    if (timerStatus !== "running") return;

    const interval = setInterval(() => {
      if (!timerExpectedEndRef.current) return;
      const left = Math.max(0, Math.round((timerExpectedEndRef.current - Date.now()) / 1000));
      setTimerRemainingSec(left);

      if (left <= 0) {
        clearInterval(interval);
        handleTimerComplete();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [timerStatus]);

  // TIMER ACTIONS
  const startTimer = () => {
    const totalSec = timerRemainingSec > 0 ? timerRemainingSec : timerDurationMin * 60;
    const expEnd = Date.now() + totalSec * 1000;
    timerExpectedEndRef.current = expEnd;
    setTimerRemainingSec(totalSec);
    setTimerStatus("running");
    setTimerAlert("");
    persistTimerState("running", totalSec, expEnd);
  };

  const pauseTimer = () => {
    timerExpectedEndRef.current = null;
    setTimerStatus("paused");
    persistTimerState("paused", timerRemainingSec, null);
  };

  const resetTimer = () => {
    timerExpectedEndRef.current = null;
    const defaultSec = timerDurationMin * 60;
    setTimerRemainingSec(defaultSec);
    setTimerStatus("idle");
    setTimerAlert("");
    persistTimerState("idle", defaultSec, null);
  };

  const selectTimerPreset = (minutes: number, mode: "focus" | "break" = "focus") => {
    timerExpectedEndRef.current = null;
    setTimerDurationMin(minutes);
    setTimerMode(mode);
    const sec = minutes * 60;
    setTimerRemainingSec(sec);
    setTimerStatus("idle");
    setTimerAlert("");
    persistTimerState("idle", sec, null);
  };

  const handleTimerComplete = async () => {
    setTimerStatus("completed");
    timerExpectedEndRef.current = null;

    if (timerMode === "focus") {
      const newCount = completedSessionsCount + 1;
      setCompletedSessionsCount(newCount);

      // Offer long break suggestion after 4 sessions
      if (newCount % 4 === 0) {
        setTimerAlert("Outstanding effort! You completed 4 focus sessions. We recommend a 15-minute restorative break.");
      } else {
        setTimerAlert("Focus session complete! Great work. Take a 5-minute breather or start your next block.");
      }

      // Persist to Server via /api/timer
      try {
        const res = await fetch("/api/timer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            request_id: goalData.id,
            task_activity: timerTask || "General Deliberate Focus",
            duration_min: timerDurationMin,
            actual_duration_min: timerDurationMin,
            status: "completed",
            started_at: new Date(Date.now() - timerDurationMin * 60000).toISOString(),
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setUserXp((prev) => prev + (data.xp_awarded || 35));
        }
      } catch {
        // Fallback local award
        setUserXp((prev) => prev + timerDurationMin + 15);
      }
    } else {
      setTimerAlert("Break time finished! Ready to resume your deep focus block?");
    }

    persistTimerState("completed", 0, null);
  };

  // START 30-DAY GOAL ACTION
  const handleStartGoal = async () => {
    if (!goalData?.id) return;
    setIsStarting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: goalData.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start goal.");

      if (data.session_token) {
        localStorage.setItem(`auramind_session_${goalData.id}`, data.session_token);
      }

      await loadGoal();
    } catch (e: any) {
      setErrorMsg(e.message || "Could not start goal.");
    } finally {
      setIsStarting(false);
    }
  };

  // CHECK-IN SUBMISSION
  const submitCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalData?.id || isSubmittingCheckin) return;
    setIsSubmittingCheckin(true);
    setCoachingFeedback("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: goalData.id,
          day: selectedDay,
          planned: checkinPlanned || "Scheduled Session",
          actual: checkinActual || checkinPlanned,
          status: checkinStatus,
          focused_min: Number(checkinFocusedMin),
          distraction_min: Number(checkinDistractionMin),
          distraction_type: checkinDistractionType || null,
          reason: checkinReason || null,
          period: checkinPeriod,
          notes: checkinNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log check-in.");

      setCoachingFeedback(data.coaching || "Check-in logged successfully!");
      setCheckinNotes("");
      setCheckinActual("");
      setUserXp((prev) => prev + 25);
      await loadCheckins();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to record check-in.");
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  // ASK AURAMIND CHAT SUBMISSION
  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isSendingChat || !goalData?.id) return;

    const userText = chatInput.trim();
    setChatInput("");
    setIsSendingChat(true);

    const optimisticMessage = { role: "user", content: userText, created_at: new Date().toISOString() };
    setChatMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request_id: goalData.id,
          message: userText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI response failed.");

      const assistantMessage = { role: "assistant", content: data.reply, created_at: new Date().toISOString() };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Connection error: ${e.message || "Unable to reach Gemini assistant."}. Please retry.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // ADAPTIVE SCHEDULE TRIGGER
  const handleAdaptSchedule = async () => {
    if (!goalData?.id || isAdapting) return;
    setIsAdapting(true);
    setErrorMsg("");

    try {
      const nextStartDay = Math.min(24, Math.floor((selectedDay - 1) / 7) * 7 + 8);
      const res = await fetch("/api/adapt", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request_id: goalData.id,
          start_day: nextStartDay,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adapt schedule.");

      setAdaptiveProposal(data.adaptive_proposal);
      await loadGoal();
    } catch (e: any) {
      setErrorMsg(e.message || "Could not generate adaptive schedule.");
    } finally {
      setIsAdapting(false);
    }
  };

  // Format Timer mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // LOADING STATE
  if (isLoading) {
    return (
      <div className="container-narrow" style={{ paddingTop: "80px", textAlign: "center" }}>
        <div style={{ color: "var(--yellow-primary)", fontSize: "1.2rem", fontWeight: 700 }}>
          Loading your AuraMind goal...
        </div>
      </div>
    );
  }

  // ERROR OR NOT FOUND
  if (!goalData) {
    return (
      <div className="container-narrow" style={{ paddingTop: "80px", textAlign: "center" }}>
        <div className="card card-highlight">
          <h2>Goal Request Not Found</h2>
          <p className="text-secondary">{errorMsg || "We could not find a goal corresponding to this ID or Request Code."}</p>
          <Link href="/" className="btn btn-primary">
            &larr; Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // 1. STATUS IS NOT READY (PENDING / RESEARCHING / REVIEW)
  if (goalData.status !== "ready") {
    const isArchived = goalData.status === "archived";

    return (
      <div className="container-narrow" style={{ paddingTop: "60px", paddingBottom: "80px" }}>
        <div className="card card-highlight" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div className="flex-center" style={{ gap: "8px", marginBottom: "16px" }}>
            <span
              className={`badge ${
                goalData.status === "review"
                  ? "badge-yellow"
                  : goalData.status === "researching"
                  ? "badge-yellow"
                  : "badge-gray"
              }`}
            >
              Status: {goalData.status.toUpperCase()}
            </span>
            <span className="font-mono text-xs text-yellow">{goalData.request_code}</span>
          </div>

          <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>{goalData.goal}</h1>

          <div style={{ maxWidth: "540px", margin: "0 auto 30px" }}>
            {isArchived ? (
              <p>This goal request has been archived.</p>
            ) : (
              <div>
                <p>
                  Your goal is currently in our learning-science research and timetable synthesis pipeline.
                  Plans undergo structured pedagogical verification before being released to you.
                </p>

                {/* Progress Pipeline Visualization */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    margin: "24px 0",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor: "var(--bg-elevated)",
                      border: "1px solid var(--yellow-primary)",
                      color: "var(--yellow-primary)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    1. Queued &#10003;
                  </div>
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor:
                        goalData.status === "researching" || goalData.status === "review"
                          ? "var(--bg-elevated)"
                          : "var(--bg-secondary)",
                      border:
                        goalData.status === "researching" || goalData.status === "review"
                          ? "1px solid var(--yellow-primary)"
                          : "1px solid var(--border-color)",
                      color:
                        goalData.status === "researching" || goalData.status === "review"
                          ? "var(--yellow-primary)"
                          : "var(--text-muted)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    2. Researching
                  </div>
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      backgroundColor:
                        goalData.status === "review" ? "var(--bg-elevated)" : "var(--bg-secondary)",
                      border:
                        goalData.status === "review"
                          ? "1px solid var(--yellow-primary)"
                          : "1px solid var(--border-color)",
                      color: goalData.status === "review" ? "var(--yellow-primary)" : "var(--text-muted)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    3. Final Review
                  </div>
                </div>

                <div className="alert alert-info" style={{ textAlign: "left" }}>
                  <div>
                    <strong>Verification Window:</strong> Comprehensive research and 30-day curriculum design can take up to <strong>12 hours</strong>. This page automatically updates every few seconds once your plan is ready.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => loadGoal()}>
              &#x21bb; Check Now
            </button>
            <Link href="/" className="btn btn-secondary btn-sm">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. STATUS IS READY, BUT USER HAS NOT CLICKED "START 30-DAY GOAL"
  if (!goalData.started_at) {
    const plan = goalData.plan;

    return (
      <div className="container-narrow" style={{ paddingTop: "50px", paddingBottom: "80px" }}>
        <div className="card card-highlight">
          <div className="flex-between" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
            <span className="badge badge-success">&#10003; 30-Day Timetable Ready</span>
            <span className="text-xs font-mono text-muted">{goalData.request_code}</span>
          </div>

          <h1 style={{ fontSize: "2.2rem", marginBottom: "8px" }}>{goalData.goal}</h1>
          <div className="text-sm text-secondary" style={{ marginBottom: "20px" }}>
            {formatLevel(goalData.category, goalData.current_level, goalData.context?.custom_current_level)} &rarr;{" "}
            {formatLevel(goalData.category, goalData.target_level, goalData.context?.custom_target_level)} &bull;{" "}
            {goalData.context?.hours}h / day in your {goalData.context?.focus} focus window
          </div>

          {plan && (
            <div style={{ backgroundColor: "var(--bg-secondary)", padding: "18px", borderRadius: "8px", marginBottom: "24px" }}>
              <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "4px" }}>Curriculum Roadmap:</div>
              <p style={{ fontSize: "0.95rem", marginBottom: "16px" }}>{plan.goal_summary}</p>

              <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "6px" }}>4-Week Phased Milestones:</div>
              <div className="grid-2" style={{ gap: "10px" }}>
                {plan.weekly_focus?.map((wf: any) => (
                  <div key={wf.week} style={{ backgroundColor: "var(--bg-elevated)", padding: "10px 14px", borderRadius: "6px", fontSize: "0.85rem" }}>
                    <strong style={{ color: "var(--text-primary)" }}>Week {wf.week}: {wf.title}</strong>
                    <div className="text-muted" style={{ marginTop: "2px" }}>{wf.expected_outcome}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

          <div style={{ textAlign: "center" }}>
            <p className="text-sm text-muted" style={{ marginBottom: "16px" }}>
              Day 1 commences the moment you start. All timers, hourly check-ins, and AI accountability features will activate.
            </p>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={isStarting}
              onClick={handleStartGoal}
              style={{ width: "100%", maxWidth: "420px" }}
            >
              {isStarting ? "Initializing Persistent Session…" : "Start 30-Day Goal \u2192"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. FULL PRODUCTION DASHBOARD (PLAN IS STARTED)
  const plan = goalData.plan;
  const currentDay = Math.min(30, Math.max(1, Math.floor((Date.now() - Date.parse(goalData.started_at)) / 864e5) + 1));
  const activeDayPlan = plan?.days?.find((d: any) => d.day === selectedDay) || plan?.days?.[0];

  return (
    <div className="container" style={{ paddingTop: "24px", paddingBottom: "80px" }}>
      {/* DASHBOARD HERO HEADER */}
      <div className="card card-highlight" style={{ padding: "20px 24px", marginBottom: "20px" }}>
        <div className="flex-between" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div className="flex-between" style={{ justifyContent: "flex-start", gap: "8px", marginBottom: "6px" }}>
              <span className="badge badge-yellow">Day {currentDay} of 30</span>
              <span className="badge badge-gray">{activeDayPlan?.phase}</span>
              <span className="font-mono text-xs text-muted">{goalData.request_code}</span>
            </div>
            <h1 style={{ fontSize: "1.9rem", margin: "4px 0" }}>{goalData.goal}</h1>
            <div className="text-xs text-secondary">
              Progression: {formatLevel(goalData.category, goalData.current_level, goalData.context?.custom_current_level)} &rarr; {formatLevel(goalData.category, goalData.target_level, goalData.context?.custom_target_level)} &bull; Available: {goalData.context?.hours}h / day
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>Level {Math.max(1, Math.floor(Math.sqrt(userXp / 50)) + 1)}</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--yellow-primary)" }}>{userXp} XP</div>
            </div>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "var(--yellow-muted)",
                border: "2px solid var(--yellow-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                color: "var(--yellow-primary)",
              }}
            >
              &#9733;
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === "plan" ? "active" : ""}`}
          onClick={() => setActiveTab("plan")}
        >
          Curriculum &amp; Day {selectedDay}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "timer" ? "active" : ""}`}
          onClick={() => setActiveTab("timer")}
        >
          Focus Timer
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "checkin" ? "active" : ""}`}
          onClick={() => setActiveTab("checkin")}
        >
          Hourly Check-In
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          Ask AuraMind (AI)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Reports &amp; Metrics
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "adaptive" ? "active" : ""}`}
          onClick={() => setActiveTab("adaptive")}
        >
          Adaptive Schedule
        </button>
      </div>

      {/* TAB 1: CURRICULUM & TODAY'S PLAN */}
      {activeTab === "plan" && (
        <div>
          {/* DAY PICKER */}
          <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
            <div className="flex-between" style={{ marginBottom: "10px" }}>
              <span className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 700 }}>
                Select Day to Inspect (30 Days Total)
              </span>
              <span className="text-xs text-yellow" style={{ fontWeight: 600 }}>
                Currently on Day {currentDay}
              </span>
            </div>

            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px" }}>
              {plan?.days?.map((d: any) => {
                const isSelected = d.day === selectedDay;
                const isToday = d.day === currentDay;
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDay(d.day)}
                    style={{
                      minWidth: "44px",
                      height: "44px",
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "var(--yellow-primary)" : isToday ? "var(--bg-elevated)" : "var(--bg-secondary)",
                      color: isSelected ? "#0A0A0A" : isToday ? "var(--yellow-primary)" : "var(--text-secondary)",
                      border: isSelected ? "1px solid var(--yellow-primary)" : isToday ? "1px solid var(--yellow-border)" : "1px solid var(--border-color)",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTIVE DAY TASKS */}
          <div className="card">
            <div className="flex-between" style={{ marginBottom: "16px", flexWrap: "wrap" }}>
              <div>
                <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>{activeDayPlan?.phase}</span>
                <h2 style={{ fontSize: "1.6rem", margin: "2px 0" }}>
                  {activeDayPlan?.day_label || `Day ${selectedDay}`} &mdash; {activeDayPlan?.calendar_date}
                </h2>
              </div>

              <button
                type="button"
                className="btn btn-outline-yellow btn-sm"
                onClick={() => {
                  if (activeDayPlan?.blocks?.[0]) {
                    setTimerTask(activeDayPlan.blocks[0].activity);
                    setActiveTab("timer");
                  }
                }}
              >
                Start Priority in Focus Timer &rarr;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeDayPlan?.blocks?.map((block: any, idx: number) => (
                <div
                  key={idx}
                  className={`task-block ${
                    block.priority === "high" ? "priority-high" : block.priority === "medium" ? "priority-medium" : "priority-low"
                  }`}
                >
                  <div className="flex-between" style={{ marginBottom: "6px" }}>
                    <div>
                      <span className="task-time">{block.start} &ndash; {block.end}</span>
                      <strong style={{ fontSize: "1.05rem", color: "var(--text-primary)" }}>{block.activity}</strong>
                    </div>
                    <span className="badge badge-gray" style={{ fontSize: "0.7rem" }}>
                      {block.category} &bull; {block.priority}
                    </span>
                  </div>
                  <p className="text-xs text-secondary" style={{ margin: 0 }}>
                    {block.reason}
                  </p>

                  <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.75rem", padding: "4px 10px", minHeight: "28px" }}
                      onClick={() => {
                        setTimerTask(block.activity);
                        setActiveTab("timer");
                      }}
                    >
                      &#9654; Open in Timer
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.75rem", padding: "4px 10px", minHeight: "28px" }}
                      onClick={() => {
                        setCheckinPlanned(`${block.start} ${block.activity}`);
                        setActiveTab("checkin");
                      }}
                    >
                      &#10003; Log Check-In
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ROADMAP PHASES & MILESTONES PREVIEW */}
          <details className="card" style={{ marginTop: "20px" }}>
            <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "1.05rem" }}>
              Explore Full 30-Day Weekly Architecture &amp; Milestones
            </summary>
            <div style={{ marginTop: "16px" }}>
              <div className="grid-2" style={{ gap: "12px", marginBottom: "16px" }}>
                {plan?.weekly_focus?.map((wf: any) => (
                  <div key={wf.week} style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <div style={{ color: "var(--yellow-primary)", fontWeight: 700, fontSize: "0.9rem" }}>Week {wf.week}: {wf.title}</div>
                    <div className="text-xs text-secondary" style={{ margin: "4px 0" }}>{wf.focus}</div>
                    <div className="text-xs text-muted"><strong>Target Outcome:</strong> {wf.expected_outcome}</div>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "8px" }}>Milestone Checkpoints:</div>
                {plan?.milestones?.map((m: any, idx: number) => (
                  <div key={idx} className="text-xs text-secondary" style={{ padding: "4px 0" }}>
                    &bull; <strong>Day {m.day}:</strong> {m.milestone}
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      )}

      {/* TAB 2: INTERACTIVE FOCUS TIMER */}
      {activeTab === "timer" && (
        <div className="container-narrow">
          <div className="card card-highlight" style={{ textAlign: "center", padding: "36px 20px" }}>
            <div className="flex-between" style={{ justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
              <span className={`badge ${timerMode === "focus" ? "badge-yellow" : "badge-gray"}`}>
                {timerMode === "focus" ? "Deep Focus Session" : "Restorative Break"}
              </span>
              <span className="badge badge-gray">{completedSessionsCount} Completed Today</span>
            </div>

            {/* TASK ATTACHMENT */}
            <div style={{ maxWidth: "480px", margin: "0 auto 24px" }}>
              <label htmlFor="timerTask" className="text-xs text-muted" style={{ marginBottom: "4px" }}>
                Active Task Block
              </label>
              <input
                id="timerTask"
                type="text"
                placeholder="What task are you working on right now?"
                value={timerTask}
                onChange={(e) => setTimerTask(e.target.value)}
                style={{ textAlign: "center", fontWeight: 600 }}
              />
            </div>

            {/* LARGE DIGITAL TIMER DISPLAY */}
            <div
              style={{
                fontSize: "5.5rem",
                fontWeight: 900,
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "-0.04em",
                color: timerStatus === "running" ? "var(--yellow-primary)" : "var(--text-primary)",
                lineHeight: 1,
                margin: "10px 0 24px",
                textShadow: timerStatus === "running" ? "0 0 24px rgba(255, 214, 0, 0.25)" : "none",
                transition: "color 0.2s ease",
              }}
            >
              {formatTimer(timerRemainingSec)}
            </div>

            {/* CONTROLS */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "28px" }}>
              {timerStatus !== "running" ? (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={startTimer}
                  style={{ minWidth: "160px" }}
                >
                  {timerStatus === "paused" ? "Resume" : "Start Focus"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-lg"
                  onClick={pauseTimer}
                  style={{ minWidth: "160px" }}
                >
                  Pause
                </button>
              )}

              <button type="button" className="btn btn-secondary btn-lg" onClick={resetTimer}>
                Reset
              </button>
            </div>

            {timerAlert && (
              <div className="alert alert-info" style={{ maxWidth: "480px", margin: "0 auto 24px", textAlign: "left" }}>
                {timerAlert}
              </div>
            )}

            {/* PRESET SELECTORS */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
              <div className="text-xs text-muted" style={{ marginBottom: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                Focus Presets
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap", marginBottom: "16px" }}>
                {TIMER_PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    type="button"
                    className={`btn btn-sm ${timerDurationMin === p.minutes && timerMode === "focus" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => selectTimerPreset(p.minutes, "focus")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="text-xs text-muted" style={{ marginBottom: "10px", fontWeight: 700, textTransform: "uppercase" }}>
                Break Presets
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                {BREAK_PRESETS.map((p) => (
                  <button
                    key={p.minutes}
                    type="button"
                    className={`btn btn-sm ${timerDurationMin === p.minutes && timerMode === "break" ? "btn-outline-yellow" : "btn-secondary"}`}
                    onClick={() => selectTimerPreset(p.minutes, "break")}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOURLY ACCOUNTABILITY CHECK-IN */}
      {activeTab === "checkin" && (
        <div className="container-narrow">
          <div className="card card-highlight">
            <div style={{ marginBottom: "20px" }}>
              <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>Real-World Execution Signal</span>
              <h2 style={{ fontSize: "1.6rem", margin: "4px 0" }}>Hourly Accountability Check-In</h2>
              <p className="text-sm text-secondary" style={{ margin: 0 }}>
                Record what happened during this block. Missed tasks are diagnostic signals used to improve your timetable, never moral failures.
              </p>
            </div>

            <form onSubmit={submitCheckin}>
              {/* Planned Task */}
              <div className="form-group">
                <label>Planned Task from Schedule</label>
                <select
                  value={checkinPlanned}
                  onChange={(e) => setCheckinPlanned(e.target.value)}
                  required
                >
                  <option value="">-- Choose scheduled task block --</option>
                  {activeDayPlan?.blocks?.map((b: any, idx: number) => (
                    <option key={idx} value={`${b.start} ${b.activity}`}>
                      {b.start} &ndash; {b.end}: {b.activity}
                    </option>
                  ))}
                  <option value="Self-Directed Task">Self-Directed Study Task</option>
                </select>
              </div>

              {/* What actually happened */}
              <div className="form-group">
                <label>What You Actually Did</label>
                <input
                  type="text"
                  placeholder="e.g. Read chapter 2, completed 4 grammar exercises, or skipped due to meeting"
                  value={checkinActual}
                  onChange={(e) => setCheckinActual(e.target.value)}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Outcome Status</label>
                  <select
                    value={checkinStatus}
                    onChange={(e) => setCheckinStatus(e.target.value as any)}
                  >
                    <option value="done">Completed as Planned</option>
                    <option value="partial">Partially Completed</option>
                    <option value="missed">Missed Session</option>
                    <option value="different">Worked on a Different Task</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Time of Day Window</label>
                  <select
                    value={checkinPeriod}
                    onChange={(e) => setCheckinPeriod(e.target.value as any)}
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Focused Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={checkinFocusedMin}
                    onChange={(e) => setCheckinFocusedMin(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label>Distracted Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="300"
                    value={checkinDistractionMin}
                    onChange={(e) => setCheckinDistractionMin(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Distraction Category (If Any)</label>
                  <select
                    value={checkinDistractionType}
                    onChange={(e) => setCheckinDistractionType(e.target.value)}
                  >
                    <option value="">None / Focused</option>
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {REASON_LABELS[r] || r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Main Bottleneck Reason (If Incomplete)</label>
                  <select
                    value={checkinReason}
                    onChange={(e) => setCheckinReason(e.target.value)}
                  >
                    <option value="">None / Success</option>
                    {REASONS.map((r) => (
                      <option key={r} value={r}>
                        {REASON_LABELS[r] || r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Reflection Notes</label>
                <textarea
                  rows={2}
                  placeholder="What specifically felt easy or difficult? Any friction points?"
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                />
              </div>

              {errorMsg && <div className="alert alert-error">{errorMsg}</div>}

              <button
                type="submit"
                disabled={isSubmittingCheckin}
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                {isSubmittingCheckin ? "Analyzing Signal…" : "Save Check-In & Get AI Feedback \u2192"}
              </button>
            </form>

            {coachingFeedback && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-elevated)",
                  border: "1px solid var(--yellow-border)",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "4px" }}>
                  AuraMind Diagnostic Feedback:
                </div>
                <div style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>
                  {coachingFeedback}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ASK AURAMIND AI CHAT */}
      {activeTab === "chat" && (
        <div className="container-narrow">
          <div className="card" style={{ display: "flex", flexDirection: "column", height: "620px", padding: "16px" }}>
            <div className="flex-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Ask AuraMind &mdash; AI Accountability Coach</h3>
                <div className="text-xs text-muted">Full context active: your 30-day plan, check-in history, and focus metrics</div>
              </div>
              <span className="badge badge-yellow">Gemini AI</span>
            </div>

            {/* MESSAGES LIST */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "6px" }}>
              {chatMessages.length === 0 ? (
                <div style={{ margin: "auto", textAlign: "center", maxWidth: "400px" }}>
                  <p className="text-secondary text-sm">
                    Ask anything about your timetable, concepts, or missed tasks.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setChatInput("What should I focus on today to make the biggest impact?")}
                    >
                      "What should I focus on today?"
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setChatInput("I fell behind yesterday. How should I adjust without getting overwhelmed?")}
                    >
                      "I fell behind yesterday. How should I adjust?"
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setChatInput("Explain how to break down today's hardest task into smaller steps.")}
                    >
                      "Break down today's hardest task."
                    </button>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, i) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isUser ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        backgroundColor: isUser ? "var(--yellow-primary)" : "var(--bg-elevated)",
                        color: isUser ? "#0A0A0A" : "var(--text-primary)",
                        border: isUser ? "none" : "1px solid var(--border-color)",
                        fontSize: "0.95rem",
                        lineHeight: 1.5,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>
                  );
                })
              )}
              {isSendingChat && (
                <div
                  style={{
                    alignSelf: "flex-start",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--yellow-primary)",
                    fontSize: "0.85rem",
                  }}
                >
                  AuraMind is thinking…
                </div>
              )}
            </div>

            {/* MESSAGE COMPOSER */}
            <form onSubmit={sendChatMessage} style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Ask AuraMind anything about your schedule, concept, or strategy..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatInput.trim()}
                className="btn btn-primary"
                style={{ whiteSpace: "nowrap" }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS & METRICS */}
      {activeTab === "reports" && (
        <div>
          <div className="grid-2">
            {/* DAILY REPORT */}
            <div className="card card-highlight">
              <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Day {selectedDay} Analysis</span>
              <h3>Daily Execution Metrics</h3>

              {dailyReport?.enough ? (
                <div style={{ marginTop: "14px" }}>
                  <div className="grid-2" style={{ gap: "10px", marginBottom: "16px" }}>
                    <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
                      <div className="text-xs text-muted">Completion Rate</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--yellow-primary)" }}>
                        {dailyReport.completion_pct}%
                      </div>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
                      <div className="text-xs text-muted">Measured Focus</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                        {dailyReport.focused_min} min
                      </div>
                    </div>
                  </div>

                  <div className="text-sm" style={{ marginBottom: "8px" }}>
                    <strong>Strongest Period:</strong> {dailyReport.strongest_period} &bull; <strong>Weakest:</strong> {dailyReport.weakest_period}
                  </div>
                  <div className="text-sm" style={{ marginBottom: "16px" }}>
                    <strong>Primary Blocker:</strong> {REASON_LABELS[dailyReport.primary_blocker] || dailyReport.primary_blocker}
                  </div>

                  <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "4px" }}>Tomorrow's Pacing:</div>
                    <div className="text-xs text-secondary">{dailyReport.tomorrow_recommendation}</div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted" style={{ padding: "20px 0" }}>
                  Not enough check-ins logged for Day {selectedDay} yet. Complete your first block to generate daily analytics.
                </p>
              )}
            </div>

            {/* WEEKLY REPORT */}
            <div className="card">
              <span className="badge badge-gray" style={{ marginBottom: "8px" }}>7-Day Consistency</span>
              <h3>Weekly Behavioral Patterns</h3>

              {weeklyReport?.enough ? (
                <div style={{ marginTop: "14px" }}>
                  <div className="grid-2" style={{ gap: "10px", marginBottom: "16px" }}>
                    <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
                      <div className="text-xs text-muted">Weekly Consistency</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--yellow-primary)" }}>
                        {weeklyReport.weekly_consistency_pct}%
                      </div>
                    </div>
                    <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
                      <div className="text-xs text-muted">Total Deep Work</div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                        {weeklyReport.total_focused_hours} hrs
                      </div>
                    </div>
                  </div>

                  <div className="text-sm" style={{ marginBottom: "8px" }}>
                    <strong>Peak Window:</strong> {weeklyReport.strongest_period} &bull; <strong>Lowest Energy:</strong> {weeklyReport.weakest_period}
                  </div>
                  <div className="text-sm" style={{ marginBottom: "16px" }}>
                    <strong>Repeated Distraction:</strong> {REASON_LABELS[weeklyReport.repeated_distraction] || weeklyReport.repeated_distraction}
                  </div>

                  <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "4px" }}>Learning Science Recommendations:</div>
                    <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {weeklyReport.recommendations?.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted" style={{ padding: "20px 0" }}>
                  {weeklyReport?.message || "Need at least 4 logged check-ins across the week to confirm recurring behavioral patterns."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ADAPTIVE SCHEDULE */}
      {activeTab === "adaptive" && (
        <div className="container-narrow">
          <div className="card card-highlight">
            <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>Evidence-Based Rebuild</span>
            <h2 style={{ fontSize: "1.6rem", margin: "4px 0" }}>Adaptive Upcoming 7-Day Timetable</h2>
            <p className="text-sm text-secondary">
              AuraMind doesn't believe in forcing rigid schedules when reality intervenes. Rebuild your upcoming 7 days based on actual recorded check-in friction.
            </p>

            {adaptiveProposal ? (
              <div style={{ marginTop: "20px" }}>
                <div style={{ backgroundColor: "var(--bg-secondary)", padding: "16px", borderRadius: "8px", marginBottom: "16px" }}>
                  <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "4px" }}>Adaptation Rationale:</div>
                  <p className="text-sm" style={{ marginBottom: "12px" }}>{adaptiveProposal.rationale}</p>

                  <div style={{ fontWeight: 700, color: "var(--yellow-primary)", marginBottom: "6px" }}>Key Adjustments Made:</div>
                  <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    {adaptiveProposal.key_adjustments?.map((adj: string, idx: number) => (
                      <li key={idx}>{adj}</li>
                    ))}
                  </ul>
                </div>

                <div className="alert alert-success">
                  &#10003; Adapted 7-day schedule has been applied to your active timetable!
                </div>
              </div>
            ) : (
              <div style={{ marginTop: "20px", textAlign: "center" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isAdapting}
                  onClick={handleAdaptSchedule}
                >
                  {isAdapting ? "Synthesizing Evidence-Based Schedule…" : "Rebuild Upcoming 7 Days with Gemini \u2192"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
