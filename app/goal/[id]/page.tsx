"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatLevel } from "@/lib/categories";
import { REASON_LABELS } from "@/lib/analysis";
import { AuraMindSymbol } from "@/components/AuraMindBrand";

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
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "timetable" | "timer" | "checkin" | "reports" | "chat" | "adaptive" | "my_goal"
  >("overview");

  // Selected Day (defaults to calculated current day)
  const [selectedDay, setSelectedDay] = useState(1);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState("all");

  // Focus Timer State
  const [timerDurationMin, setTimerDurationMin] = useState(25);
  const [customTimerMin, setCustomTimerMin] = useState("");
  const [timerRemainingSec, setTimerRemainingSec] = useState(25 * 60);
  const [timerStatus, setTimerStatus] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [timerTask, setTimerTask] = useState("");
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [timerAlert, setTimerAlert] = useState("");
  const [fullscreenFocus, setFullscreenFocus] = useState(false);
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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Adaptive Schedule State
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptiveProposal, setAdaptiveProposal] = useState<any>(null);

  // Total XP & Stats
  const [userXp, setUserXp] = useState(50);

  // Friends Social Accountability Sharing State
  const [isSharedWithFriends, setIsSharedWithFriends] = useState(false);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  useEffect(() => {
    if (goalData) {
      setIsSharedWithFriends(!!goalData.is_shared_with_friends);
    }
  }, [goalData]);

  const handleToggleFriendShare = async () => {
    if (!goalData?.id || isSharingLoading) return;
    setIsSharingLoading(true);
    const nextState = !isSharedWithFriends;
    try {
      const res = await fetch("/api/friends/share-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: goalData.id,
          isShared: nextState,
        }),
      });
      if (res.ok) {
        setIsSharedWithFriends(nextState);
      } else {
        const err = await res.json();
        alert(err.error || "Unable to update sharing settings.");
      }
    } catch {
      alert("Network error updating sharing settings.");
    } finally {
      setIsSharingLoading(false);
    }
  };

  // Google Calendar Integration State
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);
  const [calendarSyncResult, setCalendarSyncResult] = useState<string | null>(null);
  const [calendarConflicts, setCalendarConflicts] = useState<any[]>([]);

  const handleSyncToGoogleCalendar = async (selectedOnly: boolean = false) => {
    if (!goalData?.id || isCalendarSyncing) return;
    setIsCalendarSyncing(true);
    setCalendarSyncResult(null);
    setCalendarConflicts([]);

    try {
      if (selectedOnly) {
        try {
          const confRes = await fetch("/api/calendar/conflicts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ request_id: goalData.id, day: selectedDay }),
          });
          if (confRes.ok) {
            const confData = await confRes.json();
            if (confData.hasConflicts && confData.conflicts?.length > 0) {
              setCalendarConflicts(confData.conflicts);
            }
          }
        } catch {
          // ignore
        }
      }

      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: goalData.id,
          days: selectedOnly ? [selectedDay] : undefined,
          force: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error && data.error.includes("not connected")) {
          if (confirm("Google Calendar is not connected yet. Would you like to connect it now in Settings?")) {
            window.location.href = `/api/calendar/connect?returnUrl=/goal/${encodeURIComponent(idOrCode)}`;
          }
          return;
        }
        throw new Error(data.error || "Failed to sync with Google Calendar.");
      }

      setCalendarSyncResult(
        `✓ Google Calendar synced: ${data.created} created, ${data.updated} updated, ${data.skipped} up to date.`
      );
      setTimeout(() => setCalendarSyncResult(null), 6000);
    } catch (e: any) {
      setCalendarSyncResult(`Sync error: ${e.message}`);
    } finally {
      setIsCalendarSyncing(false);
    }
  };

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

  // Auto-poll if goal is synthesizing
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

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === "chat") {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeTab]);

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

  // Timer Tick Mechanism (Accurate against background tabs)
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
    const totalSec = timerDurationMin * 60;
    setTimerRemainingSec(totalSec);
    setTimerStatus("idle");
    setTimerAlert("");
    persistTimerState("idle", totalSec, null);
  };

  // Keyboard Shortcuts for Timer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.code === "Space" && activeTab === "timer") {
        e.preventDefault();
        if (timerStatus === "running") pauseTimer();
        else startTimer();
      } else if (e.key.toLowerCase() === "r" && activeTab === "timer") {
        resetTimer();
      } else if (e.key.toLowerCase() === "f" && activeTab === "timer") {
        setFullscreenFocus((prev) => !prev);
      } else if (e.key === "Escape" && fullscreenFocus) {
        setFullscreenFocus(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, timerStatus, timerRemainingSec, timerDurationMin, fullscreenFocus]);

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

  const playTimerChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio autoplay policy
    }
  };

  const handleTimerComplete = async () => {
    playTimerChime();
    setTimerStatus("completed");
    timerExpectedEndRef.current = null;

    if (timerMode === "focus") {
      const newCount = completedSessionsCount + 1;
      setCompletedSessionsCount(newCount);

      if (newCount % 4 === 0) {
        setTimerAlert("Outstanding focus! You finished 4 sessions. Take a 15-minute restorative break.");
      } else {
        setTimerAlert("Focus session complete. Log your check-in or take a 5-minute breather.");
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
        setUserXp((prev) => prev + timerDurationMin + 15);
      }
    } else {
      setTimerAlert("Break period finished. Ready for your next deep focus block?");
    }

    persistTimerState("completed", 0, null);
  };

  // GENERATE PLAN INSTANTLY WITH AI
  const handleGeneratePlanNow = async () => {
    if (!goalData?.id || isGeneratingPlan) return;
    setIsGeneratingPlan(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generate_now", id: goalData.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to synthesize timetable.");
      await loadGoal();
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to synthesize timetable.");
    } finally {
      setIsGeneratingPlan(false);
    }
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
      const historyPayload = chatMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request_id: goalData.id,
          message: userText,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI response failed.");

      const assistantMessage = {
        role: "assistant",
        content: data.reply,
        sources: data.sources,
        created_at: new Date().toISOString(),
      };
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

  const copyAccessCode = () => {
    if (!goalData?.request_code) return;
    navigator.clipboard.writeText(goalData.request_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const exportTimetableMarkdown = (goal: string, plan: any) => {
    if (!plan?.days) return;
    let md = `# AuraMind 30-Day Plan: ${goal}\n\n`;
    md += `## Goal Summary\n${plan.goal_summary}\n\n`;
    md += `## Definition of Success\n${plan.definition_of_success}\n\n`;
    md += `## 4-Week Milestones\n`;
    plan.weekly_focus?.forEach((w: any) => {
      md += `- **Week ${w.week}: ${w.title}**: ${w.focus} (Expected: ${w.expected_outcome})\n`;
    });
    md += `\n---\n\n## 30-Day Schedule\n\n`;
    plan.days.forEach((d: any) => {
      md += `### ${d.day_label || `Day ${d.day}`} (${d.calendar_date}) \u2014 ${d.phase}\n`;
      d.blocks.forEach((b: any) => {
        md += `- **${b.start} - ${b.end}** [${b.category.toUpperCase()}] (${b.priority} priority): ${b.activity}\n  *Reason: ${b.reason}*\n`;
      });
      md += `\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AuraMind-Plan-${goal.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 1. LOADING SKELETON
  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: "32px", paddingBottom: "80px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div className="skeleton" style={{ width: "220px", height: "32px" }} />
          <div className="skeleton" style={{ width: "120px", height: "32px" }} />
        </div>
        <div className="workspace-layout">
          <div className="workspace-sidebar" style={{ gap: "10px" }}>
            <div className="skeleton" style={{ height: "40px" }} />
            <div className="skeleton" style={{ height: "40px" }} />
            <div className="skeleton" style={{ height: "40px" }} />
            <div className="skeleton" style={{ height: "40px" }} />
            <div className="skeleton" style={{ height: "40px" }} />
          </div>
          <div>
            <div className="card" style={{ marginBottom: "20px" }}>
              <div className="skeleton" style={{ width: "40%", height: "28px", marginBottom: "12px" }} />
              <div className="skeleton" style={{ width: "80%", height: "18px", marginBottom: "8px" }} />
              <div className="skeleton" style={{ width: "60%", height: "18px" }} />
            </div>
            <div className="card">
              <div className="skeleton" style={{ height: "180px" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (errorMsg && !goalData) {
    return (
      <div className="container-narrow" style={{ paddingTop: "80px", paddingBottom: "80px" }}>
        <div className="card card-highlight" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--error-bg)", border: "1px solid var(--error-border)", color: "var(--error-text)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "1.2rem", fontWeight: 700 }}>
            !
          </div>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Goal Not Accessible</h2>
          <p className="text-secondary text-sm" style={{ maxWidth: "460px", margin: "0 auto 24px" }}>
            {errorMsg}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button type="button" onClick={loadGoal} className="btn btn-secondary">
              Try Again
            </button>
            <Link href="/" className="btn btn-primary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. PENDING SYNTHESIS / NOT READY STATE
  if (goalData.status !== "ready") {
    const isArchived = goalData.status === "archived";

    return (
      <div className="container-narrow" style={{ paddingTop: "60px", paddingBottom: "80px" }}>
        <div className="card card-highlight" style={{ padding: "36px 28px" }}>
          <div className="flex-between" style={{ marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <span className={`badge ${isArchived ? "badge-gray" : "badge-yellow"}`}>
              {isArchived ? "Archived" : "Action Required"}
            </span>
            <button
              type="button"
              onClick={copyAccessCode}
              className="text-xs font-mono"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-color)",
                padding: "3px 10px",
                borderRadius: "var(--radius-xs)",
                color: "var(--accent-primary)",
                cursor: "pointer",
              }}
              title="Click to copy access code"
            >
              {copiedCode ? "\u2713 Copied" : `Code: ${goalData.request_code}`}
            </button>
          </div>

          <h1 style={{ fontSize: "1.85rem", marginBottom: "8px" }}>{goalData.goal}</h1>
          <div className="text-sm text-secondary" style={{ marginBottom: "24px" }}>
            {formatLevel(goalData.category, goalData.current_level, goalData.context?.custom_current_level)} &rarr;{" "}
            {formatLevel(goalData.category, goalData.target_level, goalData.context?.custom_target_level)} &bull;{" "}
            {goalData.context?.hours || 2}h daily deliberate practice
          </div>

          {isArchived ? (
            <p className="text-muted">This goal request has been archived.</p>
          ) : (
            <div style={{ backgroundColor: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: "24px" }}>
              <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "6px" }}>
                Ready to Synthesize 30-Day Plan
              </div>
              <p className="text-sm text-secondary" style={{ margin: "0 0 16px" }}>
                AuraMind breaks your goal into a 4-week deliberate practice progression tailored to your focus window and starting level.
              </p>

              {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{errorMsg}</div>}

              <button
                type="button"
                className="btn btn-primary"
                disabled={isGeneratingPlan}
                onClick={handleGeneratePlanNow}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isGeneratingPlan ? "Synthesizing 30-Day Curriculum..." : "Synthesize 30-Day Plan with AI Now \u2192"}
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link href="/" className="btn btn-secondary btn-sm">
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. READY BUT UNSTARTED STATE
  if (!goalData.started_at) {
    const plan = goalData.plan;

    return (
      <div className="container-narrow" style={{ paddingTop: "50px", paddingBottom: "80px" }}>
        <div className="card card-highlight" style={{ padding: "36px 30px" }}>
          <div className="flex-between" style={{ marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <span className="badge badge-success">&#10003; 30-Day Timetable Synthesized</span>
            <button
              type="button"
              onClick={copyAccessCode}
              className="text-xs font-mono"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-color)",
                padding: "3px 10px",
                borderRadius: "var(--radius-xs)",
                color: "var(--accent-primary)",
                cursor: "pointer",
              }}
            >
              {copiedCode ? "\u2713 Copied" : `Access Code: ${goalData.request_code}`}
            </button>
          </div>

          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>{goalData.goal}</h1>
          <div className="text-sm text-secondary" style={{ marginBottom: "24px" }}>
            {formatLevel(goalData.category, goalData.current_level, goalData.context?.custom_current_level)} &rarr;{" "}
            {formatLevel(goalData.category, goalData.target_level, goalData.context?.custom_target_level)} &bull;{" "}
            {goalData.context?.hours || 2}h/day in your {goalData.context?.focus || "morning"} focus window
          </div>

          {plan && (
            <div style={{ backgroundColor: "var(--bg-secondary)", padding: "20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", marginBottom: "28px" }}>
              <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "4px" }}>
                Curriculum Trajectory
              </div>
              <p className="text-sm text-secondary" style={{ marginBottom: "16px", lineHeight: 1.6 }}>
                {plan.goal_summary}
              </p>

              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px", fontSize: "0.85rem" }}>
                Phased 4-Week Milestones:
              </div>
              <div className="grid-2" style={{ gap: "10px" }}>
                {plan.weekly_focus?.map((wf: any) => (
                  <div
                    key={wf.week}
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <strong style={{ color: "var(--accent-primary)" }}>Week {wf.week}: {wf.title}</strong>
                    <div className="text-muted" style={{ marginTop: "4px", fontSize: "0.8rem", lineHeight: 1.4 }}>
                      {wf.expected_outcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{errorMsg}</div>}

          {calendarSyncResult && (
            <div className="alert alert-success" style={{ marginBottom: "16px", fontSize: "0.85rem", textAlign: "center" }}>
              {calendarSyncResult}
            </div>
          )}

          <div style={{ textAlign: "center" }}>
            <p className="text-xs text-muted" style={{ marginBottom: "16px" }}>
              Day 1 commences the moment you activate. All timer logging, daily check-ins, and adaptive analytics will unlock.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", maxWidth: "520px", margin: "0 auto" }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={isStarting}
                onClick={handleStartGoal}
                style={{ flex: "1 1 240px" }}
              >
                {isStarting ? "Activating Session..." : "Start 30-Day Goal \u2192"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg"
                disabled={isCalendarSyncing}
                onClick={() => handleSyncToGoogleCalendar(false)}
                style={{ flex: "1 1 220px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <span>📅</span>
                <span>{isCalendarSyncing ? "Syncing Calendar..." : "Add to Google Calendar"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. ACTIVE DASHBOARD (GOAL STARTED)
  const plan = goalData.plan;
  const currentDay = Math.min(30, Math.max(1, Math.floor((Date.now() - Date.parse(goalData.started_at)) / 864e5) + 1));
  const activeDayPlan = plan?.days?.find((d: any) => d.day === selectedDay) || plan?.days?.[0];

  const currentLevelNumber = Math.max(1, Math.floor(Math.sqrt(userXp / 50)) + 1);

  // Filter tasks for timetable view
  const filteredBlocks = activeDayPlan?.blocks?.filter((b: any) => {
    if (taskCategoryFilter === "all") return true;
    return b.category?.toLowerCase() === taskCategoryFilter.toLowerCase();
  }) || [];

  return (
    <div className="container-wide" style={{ paddingTop: "20px", paddingBottom: "80px" }}>
      {/* TOP WORKSPACE BAR */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <AuraMindSymbol size={36} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700 }}>{goalData.goal}</h1>
              <span className="badge badge-yellow" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
                Day {currentDay} of 30
              </span>
            </div>
            <div className="text-xs text-muted" style={{ marginTop: "2px" }}>
              {formatLevel(goalData.category, goalData.current_level, goalData.context?.custom_current_level)} &bull; {goalData.context?.hours || 2}h/day &bull; Phase: {activeDayPlan?.phase || "Foundation"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleToggleFriendShare}
            disabled={isSharingLoading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 10px",
              borderRadius: "var(--radius-xs)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              backgroundColor: isSharedWithFriends ? "rgba(255, 214, 0, 0.15)" : "var(--bg-elevated)",
              border: isSharedWithFriends ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
              color: isSharedWithFriends ? "var(--accent-primary)" : "var(--text-secondary)",
            }}
            title={isSharedWithFriends ? "Visible to accepted friends on your profile" : "Share trajectory with friends"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{isSharedWithFriends ? "Shared with Friends" : "Share with Friends"}</span>
          </button>

          <button
            type="button"
            onClick={copyAccessCode}
            className="text-xs font-mono"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              padding: "5px 10px",
              borderRadius: "var(--radius-xs)",
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
            title="Click to copy code"
          >
            {copiedCode ? "\u2713 Copied" : `Code: ${goalData.request_code}`}
          </button>

          <div
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-xs)",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--accent-border)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span style={{ color: "var(--accent-primary)", fontWeight: 700, fontSize: "0.85rem" }}>
              Lv {currentLevelNumber}
            </span>
            <span className="text-xs text-muted">&bull;</span>
            <span className="text-xs font-mono" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {userXp} XP
            </span>
          </div>
        </div>
      </div>

      {/* WORKSPACE LAYOUT: SIDEBAR + MAIN STAGE */}
      <div className="workspace-layout">
        {/* SIDEBAR NAVIGATION */}
        <aside className="workspace-sidebar">
          <div style={{ padding: "4px 8px 12px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "6px" }}>
            <span className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
              Goal Workspace
            </span>
          </div>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#9638;</span>
              Overview
            </span>
            <span className="workspace-nav-item-badge">Day {currentDay}</span>
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "timetable" ? "active" : ""}`}
            onClick={() => setActiveTab("timetable")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#9776;</span>
              30-Day Timetable
            </span>
            <span className="workspace-nav-item-badge">Day {selectedDay}</span>
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "timer" ? "active" : ""}`}
            onClick={() => setActiveTab("timer")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#9201;</span>
              Focus Timer
            </span>
            {timerStatus === "running" && (
              <span className="badge badge-yellow pulse" style={{ fontSize: "0.65rem", padding: "1px 5px" }}>
                Active
              </span>
            )}
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "checkin" ? "active" : ""}`}
            onClick={() => setActiveTab("checkin")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#10003;</span>
              Hourly Check-In
            </span>
            {checkins.length > 0 && (
              <span className="workspace-nav-item-badge">{checkins.length} logged</span>
            )}
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#9684;</span>
              Reports &amp; Analytics
            </span>
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#9670;</span>
              Ask AuraMind
            </span>
            <span className="workspace-nav-item-badge">AI</span>
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "adaptive" ? "active" : ""}`}
            onClick={() => setActiveTab("adaptive")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#9881;</span>
              Adaptive Timetable
            </span>
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeTab === "my_goal" ? "active" : ""}`}
            onClick={() => setActiveTab("my_goal")}
          >
            <span>
              <span className="workspace-nav-item-icon">&#9671;</span>
              Goal Scope &amp; Details
            </span>
          </button>

          {/* SIDEBAR FOOTER CARD */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="text-xs text-muted">Daily Target</span>
              <span className="text-xs font-mono text-yellow">{goalData.context?.hours || 2} Hours</span>
            </div>
            <div style={{ width: "100%", height: "4px", backgroundColor: "var(--bg-elevated)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${Math.min(100, Math.round((completedSessionsCount * 25) / ((goalData.context?.hours || 2) * 60) * 100))}%`,
                  height: "100%",
                  backgroundColor: "var(--accent-primary)",
                  borderRadius: "2px",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)" }}>
              <span>Focus sessions: {completedSessionsCount}</span>
              <span>Day {currentDay}/30</span>
            </div>
          </div>
        </aside>

        {/* MAIN STAGE */}
        <main>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div>
              {/* TOP METRICS GRID */}
              <div className="grid-4" style={{ gap: "12px", marginBottom: "20px" }}>
                <div className="card" style={{ padding: "16px" }}>
                  <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Current Trajectory
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-primary)", margin: "4px 0 2px" }}>
                    Day {currentDay}
                  </div>
                  <div className="text-xs text-secondary">
                    Phase: {activeDayPlan?.phase || "Foundation"}
                  </div>
                </div>

                <div className="card" style={{ padding: "16px" }}>
                  <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Focus Completed
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 2px" }}>
                    {completedSessionsCount * 25}m
                  </div>
                  <div className="text-xs text-secondary">
                    {completedSessionsCount} deep sessions today
                  </div>
                </div>

                <div className="card" style={{ padding: "16px" }}>
                  <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Check-Ins Recorded
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-primary)", margin: "4px 0 2px" }}>
                    {checkins.length}
                  </div>
                  <div className="text-xs text-secondary">
                    {dailyReport?.consistency_score ? `${dailyReport.consistency_score}% Adherence` : "Awaiting diagnostics"}
                  </div>
                </div>

                <div className="card" style={{ padding: "16px" }}>
                  <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Mastery XP
                  </div>
                  <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-primary)", margin: "4px 0 2px" }}>
                    {userXp}
                  </div>
                  <div className="text-xs text-secondary">
                    Level {currentLevelNumber} Apprentice
                  </div>
                </div>
              </div>

              {/* NEXT SCHEDULED ACTION CARD */}
              <div className="card card-highlight" style={{ padding: "24px", marginBottom: "20px" }}>
                <div className="flex-between" style={{ marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <span className="badge badge-yellow">Day {currentDay} Scheduled Focus</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(currentDay);
                      setActiveTab("timetable");
                    }}
                    className="text-xs font-mono text-muted"
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-primary)" }}
                  >
                    View All {activeDayPlan?.blocks?.length || 0} Blocks &rarr;
                  </button>
                </div>

                {activeDayPlan?.blocks?.[0] ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span className="badge badge-gray font-mono">{activeDayPlan.blocks[0].start} &ndash; {activeDayPlan.blocks[0].end}</span>
                      <span className="badge badge-yellow">{activeDayPlan.blocks[0].category}</span>
                      <span className="badge badge-gray">{activeDayPlan.blocks[0].priority} priority</span>
                    </div>

                    <h2 style={{ fontSize: "1.4rem", margin: "4px 0 8px" }}>
                      {activeDayPlan.blocks[0].activity}
                    </h2>

                    <p className="text-sm text-secondary" style={{ marginBottom: "18px", lineHeight: 1.5 }}>
                      <strong style={{ color: "var(--accent-primary)" }}>Pedagogical Reason:</strong> {activeDayPlan.blocks[0].reason}
                    </p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setTimerTask(activeDayPlan.blocks[0].activity);
                          setActiveTab("timer");
                        }}
                      >
                        &#9654; Start in Focus Timer
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setCheckinPlanned(`${activeDayPlan.blocks[0].start} ${activeDayPlan.blocks[0].activity}`);
                          setActiveTab("checkin");
                        }}
                      >
                        &#10003; Log Check-In
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted text-sm">No scheduled task blocks found for today.</p>
                )}
              </div>

              {/* TWO COLUMN BRIEFING & QUICK ACTIONS */}
              <div className="grid-2" style={{ gap: "20px" }}>
                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "8px", fontSize: "0.95rem" }}>
                    AI Coach Diagnostic
                  </div>
                  <p className="text-sm text-secondary" style={{ margin: "0 0 16px", lineHeight: 1.6 }}>
                    {coachingFeedback
                      ? coachingFeedback
                      : "You are in the foundational phase of your 30-day curriculum. Prioritize high-focus deliberate practice over passive consumption. If friction occurs, log an hourly check-in so your schedule can adapt."}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab("chat")}
                  >
                    Consult AI Tutor &rarr;
                  </button>
                </div>

                <div className="card" style={{ padding: "20px" }}>
                  <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px", fontSize: "0.95rem" }}>
                    Active 4-Week Milestone
                  </div>
                  <div className="text-xs font-mono text-yellow" style={{ marginBottom: "4px" }}>
                    WEEK {Math.ceil(currentDay / 7)}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "6px" }}>
                    {plan?.weekly_focus?.[Math.ceil(currentDay / 7) - 1]?.title || "Foundational Competencies"}
                  </div>
                  <p className="text-xs text-muted" style={{ margin: "0 0 16px", lineHeight: 1.5 }}>
                    {plan?.weekly_focus?.[Math.ceil(currentDay / 7) - 1]?.expected_outcome || "Build automaticity with core mechanics."}
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab("my_goal")}
                  >
                    View Full Roadmap &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 30-DAY TIMETABLE */}
          {activeTab === "timetable" && (
            <div>
              {/* DAY SELECTOR CAROUSEL / STRIP */}
              <div className="card" style={{ padding: "16px", marginBottom: "20px" }}>
                <div className="flex-between" style={{ marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <span className="text-xs text-muted" style={{ textTransform: "uppercase", fontWeight: 700 }}>
                    Select Day (1&ndash;30)
                  </span>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span className="text-xs text-yellow" style={{ fontWeight: 600 }}>
                      Current: Day {currentDay}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                      onClick={() => exportTimetableMarkdown(goalData.goal, plan)}
                    >
                      Export .md
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: "0.75rem", padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      disabled={isCalendarSyncing}
                      onClick={() => handleSyncToGoogleCalendar(false)}
                      title="Sync all 30 days of this curriculum to your Google Calendar"
                    >
                      <span>📅</span>
                      <span>{isCalendarSyncing ? "Syncing..." : "Sync 30-Day Plan"}</span>
                    </button>
                  </div>
                </div>

                {calendarSyncResult && (
                  <div className="alert alert-success" style={{ margin: "10px 0 6px", fontSize: "0.82rem" }}>
                    {calendarSyncResult}
                  </div>
                )}

                {calendarConflicts.length > 0 && (
                  <div className="alert alert-error" style={{ margin: "10px 0 6px", fontSize: "0.82rem" }}>
                    <strong>Schedule Overlap Detected:</strong> {calendarConflicts.length} planned session(s) on Day {selectedDay} overlap with existing events on your Google Calendar ({calendarConflicts.map(c => `"${c.summary}" at ${c.blockStart}`).join(", ")}).
                  </div>
                )}

                {/* HORIZONTAL DAY PICKER */}
                <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px" }}>
                  {plan?.days?.map((d: any) => {
                    const isSelected = d.day === selectedDay;
                    const isToday = d.day === currentDay;
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => setSelectedDay(d.day)}
                        style={{
                          minWidth: "42px",
                          height: "42px",
                          borderRadius: "var(--radius-xs)",
                          backgroundColor: isSelected
                            ? "var(--accent-primary)"
                            : isToday
                            ? "var(--bg-elevated)"
                            : "var(--bg-secondary)",
                          color: isSelected ? "#0A0A0A" : isToday ? "var(--accent-primary)" : "var(--text-secondary)",
                          border: isToday
                            ? "1px solid var(--accent-primary)"
                            : "1px solid var(--border-subtle)",
                          fontWeight: isSelected || isToday ? 700 : 500,
                          fontSize: "0.85rem",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all var(--transition-fast)",
                          flexShrink: 0,
                        }}
                      >
                        <span style={{ fontSize: "0.65rem", opacity: 0.8 }}>D</span>
                        <span>{d.day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SELECTED DAY HEADER & CATEGORY FILTER */}
              <div className="card card-highlight" style={{ padding: "20px", marginBottom: "16px" }}>
                <div className="flex-between" style={{ flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="badge badge-yellow">Day {selectedDay}</span>
                      <span className="badge badge-gray">{activeDayPlan?.phase}</span>
                      {selectedDay === currentDay && <span className="badge badge-success">Today</span>}
                    </div>
                    <h2 style={{ fontSize: "1.4rem", margin: "6px 0 2px" }}>
                      {activeDayPlan?.day_label || `Day ${selectedDay}`} &bull; {activeDayPlan?.calendar_date || `Day ${selectedDay}`}
                    </h2>
                    {activeDayPlan?.daily_objective && (
                      <div className="text-xs text-yellow" style={{ marginTop: "4px", fontWeight: 600 }}>
                        Focus: {activeDayPlan.daily_objective}
                      </div>
                    )}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.72rem", padding: "3px 8px", marginTop: "6px" }}
                      disabled={isCalendarSyncing}
                      onClick={() => handleSyncToGoogleCalendar(true)}
                      title="Sync only this day's blocks to Google Calendar"
                    >
                      📅 {isCalendarSyncing ? "Syncing..." : `Sync Day ${selectedDay} to Calendar`}
                    </button>
                  </div>

                  {/* CATEGORY FILTER CHIPS */}
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["all", "deliberate_practice", "retrieval", "theory", "review"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setTaskCategoryFilter(cat)}
                        className={`badge ${taskCategoryFilter === cat ? "badge-yellow" : "badge-gray"}`}
                        style={{ cursor: "pointer", textTransform: "capitalize" }}
                      >
                        {cat.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SCHEDULED TASK BLOCKS LIST */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {filteredBlocks.length === 0 ? (
                    <p className="text-muted text-sm" style={{ padding: "16px 0", textAlign: "center" }}>
                      No tasks matching this filter.
                    </p>
                  ) : (
                    filteredBlocks.map((block: any, idx: number) => (
                      <div
                        key={idx}
                        className="task-block"
                        style={{
                          backgroundColor: "var(--bg-secondary)",
                          padding: "16px",
                          borderRadius: "var(--radius-xs)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div className="flex-between" style={{ marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="font-mono text-xs text-yellow" style={{ fontWeight: 700 }}>
                              {block.start} &ndash; {block.end}
                            </span>
                            <span className="badge badge-gray text-xs">{block.category}</span>
                            <span className="text-xs text-muted">&bull; {block.priority} priority</span>
                          </div>
                        </div>

                        <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "6px" }}>
                          {block.activity}
                        </div>

                        {block.instructions && (
                          <div className="text-xs text-secondary" style={{ marginBottom: "8px", backgroundColor: "var(--bg-elevated)", padding: "8px 10px", borderRadius: "var(--radius-xs)" }}>
                            <strong style={{ color: "var(--text-primary)" }}>Protocol:</strong> {block.instructions}
                          </div>
                        )}

                        <div className="text-xs text-secondary" style={{ marginBottom: "8px", lineHeight: 1.5 }}>
                          <strong style={{ color: "var(--accent-primary)" }}>Why this task now:</strong> {block.why_it_matters || block.reason}
                        </div>

                        {(block.expected_output || block.completion_criterion) && (
                          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "8px", fontSize: "0.75rem" }}>
                            {block.expected_output && (
                              <div style={{ color: "var(--text-secondary)" }}>
                                <strong style={{ color: "var(--text-primary)" }}>Deliverable:</strong> {block.expected_output}
                              </div>
                            )}
                            {block.completion_criterion && (
                              <div style={{ color: "var(--text-secondary)" }}>
                                <strong style={{ color: "var(--accent-success)" }}>Criterion:</strong> {block.completion_criterion}
                              </div>
                            )}
                          </div>
                        )}

                        {block.fallback_action && (
                          <div className="text-xs text-muted" style={{ marginBottom: "10px", fontStyle: "italic" }}>
                            If friction arises: {block.fallback_action}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
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
                            style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                            onClick={() => {
                              setCheckinPlanned(`${block.start} ${block.activity}`);
                              setActiveTab("checkin");
                            }}
                          >
                            &#10003; Log Check-In
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FOCUS TIMER */}
          {activeTab === "timer" && (
            <div className="container-narrow" style={{ margin: "0 auto" }}>
              <div className="card card-highlight" style={{ textAlign: "center", padding: "36px 20px" }}>
                <div className="flex-between" style={{ justifyContent: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <span className={`badge ${timerMode === "focus" ? "badge-yellow" : "badge-gray"}`}>
                    {timerMode === "focus" ? "Deep Focus Session" : "Restorative Break"}
                  </span>
                  <span className="badge badge-gray">{completedSessionsCount} Completed Today</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                    onClick={() => setFullscreenFocus(true)}
                  >
                    Focus Mode [F]
                  </button>
                </div>

                {/* TASK ATTACHMENT */}
                <div style={{ maxWidth: "480px", margin: "0 auto 24px" }}>
                  <label htmlFor="timerTask" className="text-xs text-muted" style={{ marginBottom: "6px", display: "block" }}>
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

                {/* CIRCULAR DIGITAL TIMER DISPLAY */}
                <div style={{ position: "relative", width: "290px", height: "290px", margin: "16px auto 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="290" height="290" style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
                    <circle
                      cx="145"
                      cy="145"
                      r="130"
                      stroke="var(--bg-elevated)"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="145"
                      cy="145"
                      r="130"
                      stroke="var(--accent-primary)"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 130}
                      strokeDashoffset={2 * Math.PI * 130 * (1 - Math.max(0, Math.min(1, ((timerDurationMin * 60) - timerRemainingSec) / Math.max(1, timerDurationMin * 60))))}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.4s ease" }}
                    />
                  </svg>
                  <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "4.2rem",
                        fontWeight: 900,
                        fontFamily: "ui-monospace, monospace",
                        letterSpacing: "-0.04em",
                        color: timerStatus === "running" ? "var(--accent-primary)" : "var(--text-primary)",
                        lineHeight: 1,
                        textShadow: timerStatus === "running" ? "0 0 24px rgba(255, 214, 0, 0.25)" : "none",
                        transition: "color var(--transition-fast)",
                      }}
                    >
                      {formatTimer(timerRemainingSec)}
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
                      {timerStatus === "running" ? "\u25CF Active Flow" : timerStatus === "paused" ? "\u275A\u275A Paused" : "Ready"}
                    </div>
                  </div>
                </div>

                {/* CONTROLS */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "16px" }}>
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

                <div className="text-xs text-muted" style={{ marginBottom: "24px" }}>
                  Shortcuts: <kbd style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-color)" }}>Space</kbd> Start/Pause &bull; <kbd style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-color)" }}>R</kbd> Reset &bull; <kbd style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-color)" }}>F</kbd> Focus Mode
                </div>

                {/* PRESETS */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "20px" }}>
                  <div className="text-xs text-muted" style={{ marginBottom: "8px", fontWeight: 600 }}>
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

                  <div className="text-xs text-muted" style={{ marginBottom: "8px", fontWeight: 600 }}>
                    Break Presets
                  </div>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                    {BREAK_PRESETS.map((b) => (
                      <button
                        key={b.minutes}
                        type="button"
                        className={`btn btn-sm ${timerDurationMin === b.minutes && timerMode === "break" ? "btn-primary" : "btn-secondary"}`}
                        onClick={() => selectTimerPreset(b.minutes, "break")}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {timerAlert && (
                  <div className="alert alert-info" style={{ marginTop: "20px" }}>
                    {timerAlert}
                  </div>
                )}
              </div>

              {/* FULLSCREEN FOCUS OVERLAY */}
              {fullscreenFocus && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "var(--bg-primary)",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ position: "absolute", top: "24px", right: "24px" }}
                    onClick={() => setFullscreenFocus(false)}
                  >
                    &times; Exit Focus Mode [Esc]
                  </button>

                  <span className="badge badge-yellow" style={{ marginBottom: "12px" }}>
                    {timerMode === "focus" ? "Deep Work Session" : "Restorative Break"}
                  </span>

                  <h2 style={{ fontSize: "1.8rem", color: "var(--text-primary)", maxWidth: "600px", textAlign: "center", marginBottom: "20px" }}>
                    {timerTask || "Deliberate Practice"}
                  </h2>

                  <div style={{ position: "relative", width: "380px", height: "380px", margin: "16px auto 36px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="380" height="380" style={{ transform: "rotate(-90deg)", position: "absolute", top: 0, left: 0 }}>
                      <circle
                        cx="190"
                        cy="190"
                        r="170"
                        stroke="var(--bg-elevated)"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="190"
                        cy="190"
                        r="170"
                        stroke="var(--accent-primary)"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 170}
                        strokeDashoffset={2 * Math.PI * 170 * (1 - Math.max(0, Math.min(1, ((timerDurationMin * 60) - timerRemainingSec) / Math.max(1, timerDurationMin * 60))))}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 0.4s ease" }}
                      />
                    </svg>
                    <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "5.5rem",
                          fontWeight: 900,
                          fontFamily: "ui-monospace, monospace",
                          letterSpacing: "-0.04em",
                          color: timerStatus === "running" ? "var(--accent-primary)" : "var(--text-primary)",
                          lineHeight: 1,
                          textShadow: timerStatus === "running" ? "0 0 36px rgba(255, 214, 0, 0.3)" : "none",
                        }}
                      >
                        {formatTimer(timerRemainingSec)}
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: "12px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
                        {timerStatus === "running" ? "\u25CF Deep Flow State" : timerStatus === "paused" ? "\u275A\u275A Paused" : "Ready"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "16px" }}>
                    {timerStatus !== "running" ? (
                      <button type="button" className="btn btn-primary btn-lg" onClick={startTimer} style={{ minWidth: "180px" }}>
                        {timerStatus === "paused" ? "Resume" : "Start Focus"}
                      </button>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-lg" onClick={pauseTimer} style={{ minWidth: "180px" }}>
                        Pause
                      </button>
                    )}
                    <button type="button" className="btn btn-secondary btn-lg" onClick={resetTimer}>
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: HOURLY CHECK-IN */}
          {activeTab === "checkin" && (
            <div className="container-narrow" style={{ margin: "0 auto" }}>
              <div className="card card-highlight">
                <div className="flex-between" style={{ marginBottom: "16px" }}>
                  <div>
                    <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>Diagnostic Check-In</span>
                    <h2 style={{ fontSize: "1.5rem", margin: "4px 0" }}>Log Session &amp; Friction</h2>
                  </div>
                  <span className="text-xs font-mono text-muted">Day {selectedDay}</span>
                </div>

                <form onSubmit={submitCheckin}>
                  <div className="form-group">
                    <label>Planned Task</label>
                    <select
                      value={checkinPlanned}
                      onChange={(e) => setCheckinPlanned(e.target.value)}
                    >
                      <option value="">-- Choose scheduled task or enter below --</option>
                      {activeDayPlan?.blocks?.map((b: any, idx: number) => (
                        <option key={idx} value={`${b.start} ${b.activity}`}>
                          {b.start} &ndash; {b.end}: {b.activity}
                        </option>
                      ))}
                      <option value="Self-Directed Task">Self-Directed Study Task</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>What You Actually Did</label>
                    <input
                      type="text"
                      placeholder="e.g. Read chapter 2, completed 4 exercises, or skipped due to meeting"
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
                      <label>Distraction Reason (If Any)</label>
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
                      <label>Primary Bottleneck (If Incomplete)</label>
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
                      placeholder="What felt easy or difficult? Any specific cognitive blockers?"
                      value={checkinNotes}
                      onChange={(e) => setCheckinNotes(e.target.value)}
                    />
                  </div>

                  {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{errorMsg}</div>}

                  <button
                    type="submit"
                    disabled={isSubmittingCheckin}
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    {isSubmittingCheckin ? "Analyzing Signals..." : "Save Check-In & Get AI Feedback \u2192"}
                  </button>
                </form>

                {coachingFeedback && (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "16px",
                      borderRadius: "var(--radius-xs)",
                      backgroundColor: "var(--bg-secondary)",
                      border: "1px solid var(--accent-border)",
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "4px" }}>
                      AuraMind Diagnostic Feedback:
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {coachingFeedback}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS & METRICS */}
          {activeTab === "reports" && (
            <div>
              <div className="grid-2" style={{ gap: "20px" }}>
                {/* DAILY METRICS */}
                <div className="card">
                  <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>Day {selectedDay} Diagnostics</span>
                  <h3 style={{ fontSize: "1.3rem", margin: "4px 0 16px" }}>Daily Adherence</h3>

                  {dailyReport ? (
                    <div>
                      <div className="grid-2" style={{ gap: "10px", marginBottom: "16px" }}>
                        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-xs)" }}>
                          <div className="text-xs text-muted">Focused Time</div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                            {dailyReport.focused_hours} hrs
                          </div>
                        </div>
                        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-xs)" }}>
                          <div className="text-xs text-muted">Adherence Score</div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {dailyReport.consistency_score}%
                          </div>
                        </div>
                      </div>

                      <div className="text-sm" style={{ marginBottom: "8px" }}>
                        <strong>Planned vs Actual:</strong> {dailyReport.tasks_planned} planned &bull; {dailyReport.tasks_completed} fully completed
                      </div>
                      <div className="text-sm text-secondary">
                        <strong>Distraction Cost:</strong> {dailyReport.distraction_minutes} minutes logged
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted" style={{ padding: "20px 0" }}>
                      No check-ins logged yet for Day {selectedDay}. Complete a focus session and log a check-in to see metrics.
                    </p>
                  )}
                </div>

                {/* 7-DAY CONSISTENCY */}
                <div className="card">
                  <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>7-Day Consistency</span>
                  <h3 style={{ fontSize: "1.3rem", margin: "4px 0 16px" }}>Behavioral Patterns</h3>

                  {weeklyReport?.enough ? (
                    <div>
                      <div className="grid-2" style={{ gap: "10px", marginBottom: "16px" }}>
                        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-xs)" }}>
                          <div className="text-xs text-muted">Weekly Consistency</div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-primary)" }}>
                            {weeklyReport.weekly_consistency_pct}%
                          </div>
                        </div>
                        <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-xs)" }}>
                          <div className="text-xs text-muted">Total Deep Work</div>
                          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)" }}>
                            {weeklyReport.total_focused_hours} hrs
                          </div>
                        </div>
                      </div>

                      <div className="text-sm" style={{ marginBottom: "8px" }}>
                        <strong>Peak Window:</strong> {weeklyReport.strongest_period} &bull; <strong>Lowest Energy:</strong> {weeklyReport.weakest_period}
                      </div>

                      <div style={{ backgroundColor: "var(--bg-secondary)", padding: "12px", borderRadius: "var(--radius-xs)", marginTop: "12px" }}>
                        <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "4px" }}>Learning Science Suggestions:</div>
                        <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                          {weeklyReport.recommendations?.map((r: string, idx: number) => (
                            <li key={idx} style={{ marginBottom: "4px" }}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted" style={{ padding: "20px 0" }}>
                      {weeklyReport?.message || "Log at least 4 check-ins across the week to confirm recurring behavioral patterns."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ASK AURAMIND AI CHAT */}
          {activeTab === "chat" && (
            <div className="container-narrow" style={{ margin: "0 auto" }}>
              <div className="card" style={{ display: "flex", flexDirection: "column", height: "620px", padding: "16px" }}>
                <div className="flex-between" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Ask AuraMind &mdash; AI Accountability Coach</h3>
                    <div className="text-xs text-muted">Context active: your 30-day curriculum, check-in history, and focus metrics</div>
                  </div>
                  <span className="badge badge-yellow">Gemini AI</span>
                </div>

                {/* MESSAGES LIST */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "6px" }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ margin: "auto", textAlign: "center", maxWidth: "420px" }}>
                      <p className="text-secondary text-sm" style={{ marginBottom: "16px" }}>
                        Ask questions about your timetable, concepts, or recovery strategies if you fell behind.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ textAlign: "left", justifyContent: "flex-start" }}
                          onClick={() => setChatInput("What should I focus on today to make the biggest impact?")}
                        >
                          "What should I focus on today to make the biggest impact?"
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ textAlign: "left", justifyContent: "flex-start" }}
                          onClick={() => setChatInput("I fell behind yesterday. How should I adjust without getting overwhelmed?")}
                        >
                          "I fell behind yesterday. How should I adjust?"
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ textAlign: "left", justifyContent: "flex-start" }}
                          onClick={() => setChatInput("Explain how to break down today's hardest task into smaller steps.")}
                        >
                          "Break down today's hardest task into smaller steps."
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
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: isUser ? "var(--accent-primary)" : "var(--bg-elevated)",
                            color: isUser ? "#0A0A0A" : "var(--text-primary)",
                            border: isUser ? "none" : "1px solid var(--border-subtle)",
                            fontSize: "0.925rem",
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
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-elevated)",
                        color: "var(--accent-primary)",
                        fontSize: "0.85rem",
                      }}
                    >
                      AuraMind is thinking...
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* CHAT INPUT FORM */}
                <form
                  onSubmit={sendChatMessage}
                  style={{ display: "flex", gap: "8px", marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}
                >
                  <input
                    type="text"
                    placeholder="Ask about your timetable or concepts..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isSendingChat}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSendingChat || !chatInput.trim()}
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: ADAPTIVE SCHEDULE */}
          {activeTab === "adaptive" && (
            <div className="container-narrow" style={{ margin: "0 auto" }}>
              <div className="card card-highlight">
                <span className="badge badge-yellow" style={{ marginBottom: "6px" }}>Evidence-Based Rebuild</span>
                <h2 style={{ fontSize: "1.5rem", margin: "4px 0 8px" }}>Adaptive Timetable Tuning</h2>
                <p className="text-sm text-secondary" style={{ marginBottom: "20px", lineHeight: 1.6 }}>
                  AuraMind replaces rigid calendars with cognitive adaptation. If check-ins indicate persistent bottlenecks, rebuild upcoming days based on recorded reality.
                </p>

                {adaptiveProposal ? (
                  <div>
                    <div style={{ backgroundColor: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-xs)", marginBottom: "16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "4px" }}>Adaptation Rationale:</div>
                      <p className="text-sm" style={{ marginBottom: "12px" }}>{adaptiveProposal.rationale}</p>

                      <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "6px" }}>Key Adjustments Made:</div>
                      <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {adaptiveProposal.key_adjustments?.map((adj: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: "4px" }}>{adj}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="alert alert-success">
                      &#10003; Adapted 7-day schedule has been synchronized with your active timetable.
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={isAdapting}
                      onClick={handleAdaptSchedule}
                    >
                      {isAdapting ? "Synthesizing Evidence-Based Schedule..." : "Rebuild Upcoming 7 Days with Gemini \u2192"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: GOAL SCOPE & DETAILS */}
          {activeTab === "my_goal" && (
            <div>
              <div className="card card-highlight" style={{ marginBottom: "20px" }}>
                <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>Scope Specification</span>
                <h2 style={{ fontSize: "1.6rem", margin: "4px 0 8px" }}>{goalData.goal}</h2>
                <div className="text-xs font-mono text-muted" style={{ marginBottom: "20px" }}>
                  Request ID: {goalData.id} &bull; Access Code: {goalData.request_code}
                </div>

                <div className="grid-2" style={{ gap: "16px", marginBottom: "20px" }}>
                  <div style={{ backgroundColor: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-xs)" }}>
                    <div className="text-xs text-muted">Category &amp; Domain</div>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>{goalData.category}</div>
                  </div>
                  <div style={{ backgroundColor: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-xs)" }}>
                    <div className="text-xs text-muted">Daily Time Commitment</div>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>{goalData.context?.hours || 2} Hours / Day ({goalData.context?.focus || "morning"})</div>
                  </div>
                  <div style={{ backgroundColor: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-xs)" }}>
                    <div className="text-xs text-muted">Starting Competency</div>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>
                      {formatLevel(goalData.category, goalData.current_level, goalData.context?.custom_current_level)}
                    </div>
                  </div>
                  <div style={{ backgroundColor: "var(--bg-secondary)", padding: "14px", borderRadius: "var(--radius-xs)" }}>
                    <div className="text-xs text-muted">Target Competency</div>
                    <div style={{ fontWeight: 600, marginTop: "2px" }}>
                      {formatLevel(goalData.category, goalData.target_level, goalData.context?.custom_target_level)}
                    </div>
                  </div>
                </div>

                {plan && (
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "4px" }}>
                      Definition of Success
                    </div>
                    <p className="text-sm text-secondary" style={{ marginBottom: "16px", lineHeight: 1.6 }}>
                      {plan.definition_of_success}
                    </p>

                    <div style={{ fontWeight: 600, color: "var(--accent-primary)", marginBottom: "8px" }}>
                      4-Week Milestone Roadmap
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {plan.weekly_focus?.map((wf: any) => (
                        <div
                          key={wf.week}
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            padding: "12px 16px",
                            borderRadius: "var(--radius-xs)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div style={{ color: "var(--accent-primary)", fontWeight: 600, fontSize: "0.9rem" }}>
                            Week {wf.week}: {wf.title}
                          </div>
                          <div className="text-xs text-secondary" style={{ margin: "2px 0 4px" }}>
                            {wf.focus}
                          </div>
                          <div className="text-xs text-muted">
                            Target outcome: {wf.expected_outcome}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
