"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
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
      <div
        className="card"
        style={{
          padding: "28px 32px",
          marginBottom: "28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "24px",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
              <span className="badge badge-yellow" style={{ fontSize: "0.72rem" }}>
                Member since {new Date(profile.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              {profile.email}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/#create-goal" className="btn btn-primary">
            + New Goal
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
      <div className="grid-4" style={{ gap: "16px", marginBottom: "36px" }}>
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
          <div className="text-xs text-secondary">Logged in focus telemetry</div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            Mastery XP
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent-primary)", margin: "4px 0" }}>
            {stats.totalXp}
          </div>
          <div className="text-xs text-secondary">Earned from completed sessions</div>
        </div>

        <div className="card" style={{ padding: "20px" }}>
          <div className="text-xs text-muted" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
            AI Assistant
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 6px" }}>
            Gemini Flash
          </div>
          <Link href="/chat" style={{ fontSize: "0.78rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
            Open Consultation &rarr;
          </Link>
        </div>
      </div>

      {/* 3. USER GOALS LIST */}
      <div>
        <div className="flex-between" style={{ marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
              Your 30-Day Trajectories
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Deliberate practice schedules and daily telemetry connected to your account.
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
            <h3 style={{ fontSize: "1.15rem", marginBottom: "6px" }}>No Trajectories Yet</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: "460px", margin: "0 auto 20px" }}>
              Transform your ambitions into structured, research-backed deliberate practice with daily telemetry.
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
    </div>
  );
}
