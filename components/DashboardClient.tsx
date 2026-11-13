"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FeedbackModal from "@/components/FeedbackModal";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  username?: string | null;
  auramind_id?: string | null;
}

interface GoalRequest {
  id: string;
  request_code: string;
  status: string;
  category: string;
  current_level: string;
  target_level: string;
  context: {
    goal?: string;
    hours?: number;
    focus?: string;
  };
  plan?: {
    goal_summary?: string;
    phases?: any[];
    weekly_focus?: any[];
    days?: Array<{
      day?: number;
      day_number?: number;
      day_label?: string;
      calendar_date?: string;
      phase?: string;
      theme?: string;
      blocks?: Array<{
        start?: string;
        end?: string;
        time?: string;
        activity?: string;
        task?: string;
        category?: string;
        reason?: string;
        duration_minutes?: number;
        priority?: string;
        deliverable?: string;
        [key: string]: any;
      }>;
      [key: string]: any;
    }>;
    [key: string]: any;
  };
  created_at: string;
  started_at: string | null;
}

interface DashboardClientProps {
  profile: UserProfile;
  goals: GoalRequest[];
  stats: {
    totalGoals: number;
    activeGoals: number;
    totalFocusMin: number;
    totalXp: number;
  };
}

export default function DashboardClient({ profile, goals, stats }: DashboardClientProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [pendingFriendsCount, setPendingFriendsCount] = useState<number>(0);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [subData, setSubData] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    async function loadFriendsMeta() {
      try {
        const res = await fetch("/api/friends/data");
        if (res.ok) {
          const data = await res.json();
          setPendingFriendsCount(data.incomingRequests?.length || 0);
          setFriendsCount(data.friends?.length || 0);
        }
      } catch {
        // Silently ignore
      }
    }
    async function loadSubMeta() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          setSubData(data.userSubscription);
        }
      } catch {
        // Silently ignore
      }
    }
    loadFriendsMeta();
    loadSubMeta();
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  };

  const copyAuraMindId = () => {
    if (profile.auramind_id) {
      navigator.clipboard.writeText(profile.auramind_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === "active") return g.status !== "completed" && g.status !== "archived";
    if (filter === "completed") return g.status === "completed";
    return true;
  });

  const displayName = profile.full_name || profile.email?.split("@")[0] || "AuraMind Pioneer";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container" style={{ paddingTop: "40px", paddingBottom: "72px" }}>
      {/* 1. USER PROFILE HEADER CARD */}
      <div className="card dashboard-profile-card">
        <div className="dashboard-profile-user">
          {/* Avatar Picture or Initials */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              referrerPolicy="no-referrer"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid var(--accent-primary)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            />
          ) : (
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-elevated)",
                border: "2px solid var(--accent-primary)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                fontWeight: 800,
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              {initials}
            </div>
          )}

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                {displayName}
              </h1>
              {profile.username && (
                <span className="badge badge-neutral" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
                  @{profile.username}
                </span>
              )}
              {profile.auramind_id && (
                <button
                  type="button"
                  onClick={copyAuraMindId}
                  title="Click to copy your unique AuraMind ID"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "1px dashed var(--border-default)",
                    borderRadius: "9999px",
                    padding: "2px 8px",
                    color: "var(--accent-primary)",
                    fontSize: "0.72rem",
                    fontFamily: "monospace",
                    cursor: "pointer",
                  }}
                >
                  <span>{copiedId ? "Copied!" : profile.auramind_id}</span>
                </button>
              )}
              <span className="badge badge-yellow" style={{ fontSize: "0.72rem" }}>
                Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </span>

              {subData && (
                <Link
                  href="/pricing"
                  style={{
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  title="Click to view or upgrade your subscription plan"
                >
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      backgroundColor:
                        subData.tier === "beta" || subData.tier === "platinum_beta"
                          ? subData.status === "expired" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)"
                          : subData.tier === "diamond"
                          ? "rgba(56, 189, 248, 0.15)"
                          : subData.tier === "platinum"
                          ? "rgba(255, 214, 0, 0.15)"
                          : "rgba(234, 179, 8, 0.15)",
                      color:
                        subData.tier === "beta" || subData.tier === "platinum_beta"
                          ? subData.status === "expired" ? "#F87171" : "#34D399"
                          : subData.tier === "diamond"
                          ? "#38BDF8"
                          : subData.tier === "platinum"
                          ? "var(--accent-primary)"
                          : "#EAB308",
                      border: `1px solid ${
                        subData.tier === "beta" || subData.tier === "platinum_beta"
                          ? subData.status === "expired" ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"
                          : subData.tier === "diamond"
                          ? "rgba(56, 189, 248, 0.4)"
                          : subData.tier === "platinum"
                          ? "rgba(255, 214, 0, 0.4)"
                          : "rgba(234, 179, 8, 0.4)"
                      }`,
                    }}
                  >
                    {subData.tier === "beta" || subData.tier === "platinum_beta"
                      ? subData.status === "expired"
                        ? "🚀 Platinum Beta (Expired)"
                        : "🚀 Platinum Beta (20 Days)"
                      : subData.tier === "diamond"
                      ? "💎 Diamond Plan"
                      : subData.tier === "platinum"
                      ? "🥈 Platinum Plan"
                      : "🥇 Gold Plan"}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    ({goals.length}/{subData?.plan?.maxGoals ?? 1} Goals)
                  </span>
                </Link>
              )}
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {profile.email}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="dashboard-profile-actions">
          <button
            type="button"
            onClick={() => setIsFeedbackOpen(true)}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>💬 Beta Feedback</span>
          </button>
          <Link href="/pricing" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span>⚡ Plans</span>
          </Link>
          <Link href="/#create-goal" className="btn btn-primary">
            + New Goal
          </Link>
          <Link
            href="/friends"
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Friends</span>
            {pendingFriendsCount > 0 ? (
              <span
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "#000000",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  borderRadius: "9999px",
                  padding: "1px 6px",
                  lineHeight: 1.2,
                }}
              >
                {pendingFriendsCount}
              </span>
            ) : friendsCount > 0 ? (
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                }}
              >
                ({friendsCount})
              </span>
            ) : null}
          </Link>
          <Link href="/settings" className="btn btn-secondary">
            Settings
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="btn btn-ghost"
            style={{ color: "var(--text-muted)" }}
          >
            {isLoggingOut ? "Signing out..." : "Log Out"}
          </button>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="dashboard-stats-grid">
        <div className="card" style={{ padding: "20px" }}>
          <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Active Goals
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent-primary)", margin: "4px 0" }}>
            {stats.activeGoals}
          </div>
          <div className="text-xs text-secondary">{stats.totalGoals} total enrolled</div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Total Focus Time
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--text-primary)", margin: "4px 0" }}>
            {stats.totalFocusMin}m
          </div>
          <div className="text-xs text-secondary">Logged across focus sessions</div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Consistency Level
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent-primary)", margin: "4px 0" }}>
            Level {Math.floor(stats.totalXp / 100) + 1}
          </div>
          <div className="text-xs text-secondary">{stats.totalXp} XP earned from sessions</div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Daily Check-ins
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10B981", margin: "8px 0 6px" }}>
            In-App Active
          </div>
          <div className="text-xs text-secondary">Hourly schedule prompts active</div>
        </div>
      </div>

      {/* 2.5 NEXT ACTION SPOTLIGHT CARD */}
      {goals.length > 0 ? (
        (() => {
          const primaryGoal = goals.find((g) => g.status !== "completed" && g.status !== "archived") || goals[0];
          const primaryDay = primaryGoal.started_at
            ? Math.min(30, Math.max(1, Math.floor((Date.now() - Date.parse(primaryGoal.started_at)) / 864e5) + 1))
            : 1;
          const primaryDayBlocks = primaryGoal.plan?.days?.[primaryDay - 1]?.blocks || [];

          return (
            <div
              className="card"
              style={{
                padding: "24px 28px",
                marginBottom: "28px",
                backgroundColor: "rgba(255, 214, 0, 0.04)",
                border: "1px solid var(--accent-primary)",
                borderRadius: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "20px",
                boxShadow: "0 0 20px rgba(255, 214, 0, 0.06)",
              }}
            >
              <div style={{ maxWidth: "640px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span className="badge badge-yellow" style={{ fontSize: "0.75rem", fontWeight: 800 }}>
                    🎯 RECOMMENDED NEXT ACTION FOR TODAY
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Day {primaryDay} of 30 &bull; {primaryGoal.started_at ? "In Progress" : "Ready to Start"}
                  </span>
                </div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 6px", color: "#FFFFFF" }}>
                  {primaryGoal.context?.goal || "Your Active Goal"}
                </h3>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {primaryDayBlocks.length > 0
                    ? `Today's planned task: ${primaryDayBlocks[0].activity || primaryDayBlocks[0].task || "Scheduled Session"}${primaryDayBlocks[0].start && primaryDayBlocks[0].end ? ` (${primaryDayBlocks[0].start} - ${primaryDayBlocks[0].end})` : ""}`
                    : primaryGoal.started_at
                    ? `Your Day ${primaryDay} schedule is active. Launch your focus timer or record your check-in.`
                    : "You haven't activated Day 1 yet. Click below to begin your 30-day journey!"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <Link
                  href={`/goal/${primaryGoal.id}`}
                  className="btn btn-primary"
                  style={{ padding: "12px 24px", fontWeight: 800, fontSize: "0.95rem" }}
                >
                  {primaryGoal.started_at ? "Open Today's Timetable \u2192" : "Start Day 1 Now \u2192"}
                </Link>
              </div>
            </div>
          );
        })()
      ) : (
        <div
          className="card"
          style={{
            padding: "24px 28px",
            marginBottom: "28px",
            backgroundColor: "rgba(255, 214, 0, 0.04)",
            border: "1px solid var(--accent-primary)",
            borderRadius: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", fontWeight: 800, marginBottom: "8px", display: "inline-block" }}>
              🚀 GET STARTED
            </span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 6px" }}>
              Create Your First AI 30-Day Timetable
            </h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              Submit a goal to receive a personalized day-by-day plan and daily accountability check-ins.
            </p>
          </div>
          <Link href="/#create-goal" className="btn btn-primary" style={{ padding: "12px 24px", fontWeight: 800 }}>
            + Create New Goal &rarr;
          </Link>
        </div>
      )}

      {/* 3. USER GOALS LIST */}
      <div>
        <div className="flex-between" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              Your 30-Day Goal Plans
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Personalized 30-day schedules and daily accountability check-ins connected to your account.
            </p>
          </div>

          <div className="tabs-nav" style={{ margin: 0 }}>
            <button
              type="button"
              className={`tabs-nav-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Goals ({goals.length})
            </button>
            <button
              type="button"
              className={`tabs-nav-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Active ({stats.activeGoals})
            </button>
          </div>
        </div>

        {filteredGoals.length === 0 ? (
          <div
            className="surface"
            style={{
              padding: "48px 24px",
              textAlign: "center",
              borderRadius: "14px",
              border: "1px dashed var(--border-default)",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-elevated)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 style={{ fontSize: "1.15rem", marginBottom: "6px" }}>No Active Goals Yet</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: "460px", margin: "0 auto 20px" }}>
              Transform your ambitions into structured 30-day daily schedules with hourly accountability check-ins.
            </p>
            <Link href="/#create-goal" className="btn btn-primary">
              Create Your First Goal &rarr;
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredGoals.map((g) => {
              const goalTitle = g.context?.goal || "30-Day Deliberate Practice";
              const isStarted = Boolean(g.started_at);

              return (
                <div
                  key={g.id}
                  className="card"
                  style={{
                    padding: "24px 28px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "20px",
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "14px",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <div style={{ maxWidth: "680px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                      <span className="badge badge-yellow" style={{ fontSize: "0.72rem" }}>
                        {g.category.replace("_", " ").toUpperCase()}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: "0.72rem" }}>
                        Code: {g.request_code}
                      </span>
                      <span
                        className={`badge ${isStarted ? "badge-success" : "badge-neutral"}`}
                        style={{ fontSize: "0.72rem" }}
                      >
                        {isStarted ? "In Progress" : "Ready to Start"}
                      </span>
                    </div>

                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>
                      {goalTitle}
                    </h3>

                    {g.plan?.goal_summary && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {g.plan.goal_summary}
                      </p>
                    )}

                    <div style={{ marginTop: "10px", display: "flex", gap: "16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      <span>Level: {g.current_level} &rarr; {g.target_level}</span>
                      <span>Commitment: {g.context?.hours || 2}h / day</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <Link href={`/goal/${g.id}`} className="btn btn-primary">
                      {isStarted ? "Open Workspace \u2192" : "Start Day 1 \u2192"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ABOUT AURAMIND SECTION */}
      <section
        style={{
          marginTop: "48px",
          paddingTop: "36px",
          borderTop: "1px solid var(--border-default)",
        }}
        aria-label="About AuraMind"
      >
        <div className="flex-between" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--accent-primary)",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  border: "1px solid rgba(255, 214, 0, 0.25)",
                }}
              >
                Philosophy &bull; Platform Intelligence
              </span>
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              About AuraMind
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--text-secondary)", maxWidth: "700px" }}>
              Your personal AI accountability operating system designed for deliberate practice, focus calibration, and sustained execution.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/about" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
              Read Full Story &rarr;
            </Link>
            <Link href="/features" className="btn btn-secondary btn-sm" style={{ fontWeight: 600 }}>
              Feature Index &rarr;
            </Link>
          </div>
        </div>

        {/* CORE PILLARS GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Pillar 1 */}
          <div
            className="card"
            style={{
              padding: "20px 22px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  marginBottom: "12px",
                }}
              >
                🎯
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>
                30-Day Adaptive Timetables
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                Synthesized by Gemini AI from your current proficiency, target outcome, and daily hour budget. Automatically adapts to reality when disruptions happen.
              </p>
            </div>
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
              <Link href="/#create-goal" style={{ fontSize: "0.78rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 700 }}>
                + Enrol New Trajectory &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 2 */}
          <div
            className="card"
            style={{
              padding: "20px 22px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  marginBottom: "12px",
                }}
              >
                ⏱️
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>
                Focus Telemetry &amp; Check-ins
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                Built-in focus timer, hourly progress prompts, distraction logging, and mastery XP system to turn invisible work into quantifiable momentum.
              </p>
            </div>
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
              <Link href="/chat" style={{ fontSize: "0.78rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 700 }}>
                Chat with AI Assistant &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 3 */}
          <div
            className="card"
            style={{
              padding: "20px 22px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  color: "#38BDF8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  marginBottom: "12px",
                }}
              >
                📞
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>
                Multi-Channel Accountability
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                Hourly in-app prompts on Gold, WhatsApp notifications on Platinum, and Hindi AI voice calls on Diamond to keep you unshakeable.
              </p>
            </div>
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
              <Link href="/pricing" style={{ fontSize: "0.78rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 700 }}>
                Compare Plans &rarr;
              </Link>
            </div>
          </div>

          {/* Pillar 4 */}
          <div
            className="card"
            style={{
              padding: "20px 22px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(168, 85, 247, 0.12)",
                  color: "#A855F7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  marginBottom: "12px",
                }}
              >
                🛡️
              </div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 6px", color: "var(--text-primary)" }}>
                Social Circles &amp; AuraSentinel
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                Accountability circle of up to 50 friends and World Chat, kept respectful, productive, and spam-free 24/7 by AuraSentinel AI.
              </p>
            </div>
            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
              <Link href="/friends" style={{ fontSize: "0.78rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 700 }}>
                Open Friends Circle &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* MISSION & PHILOSOPHY CALLOUT */}
        <div
          className="card"
          style={{
            padding: "24px 28px",
            backgroundColor: "#111111",
            border: "1px solid rgba(255, 214, 0, 0.2)",
            borderRadius: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ maxWidth: "720px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "1rem" }}>💡</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent-primary)" }}>
                The AuraMind Core Creed
              </span>
            </div>
            <blockquote
              style={{
                margin: "0 0 10px 0",
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#FFFFFF",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              &ldquo;Don&rsquo;t plan a perfect day. Build a system that learns your real one.&rdquo;
            </blockquote>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Most productivity apps fail because they treat humans like machines. AuraMind treats your attention as a precious, scarce resource—using machine intelligence to continually recalibrate your timetable whenever life interferes.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              minWidth: "220px",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: 700,
                marginBottom: "4px",
              }}
            >
              System Specs
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Platform Version:</span>
              <span style={{ color: "#FFFFFF", fontWeight: 700 }}>AuraMind v2.4</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>AI Synthesis:</span>
              <span style={{ color: "var(--accent-primary)", fontWeight: 700 }}>Gemini 1.5 Pro</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Security Bot:</span>
              <span style={{ color: "#10B981", fontWeight: 700 }}>AuraSentinel Active</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Data Privacy:</span>
              <span style={{ color: "#FFFFFF", fontWeight: 700 }}>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        defaultCategory="other"
        defaultFeature="Dashboard"
      />
    </div>
  );
}
