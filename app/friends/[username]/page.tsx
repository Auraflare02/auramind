"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FriendProfileDetails, FriendshipStatus } from "@/lib/friends/types";

function FriendProfileContent() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [data, setData] = useState<FriendProfileDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isBusy, setIsBusy] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [cheerSentMap, setCheerSentMap] = useState<Record<string, boolean>>({});

  const loadProfile = useCallback(async () => {
    if (!username) return;
    try {
      setIsLoading(true);
      setErrorMessage("");
      const res = await fetch(`/api/friends/profile/${encodeURIComponent(username)}`);
      if (res.status === 401) {
        router.push(`/login?next=/friends/${encodeURIComponent(username)}`);
        return;
      }
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Profile not found.");
      }
      const json: FriendProfileDetails = await res.json();
      setData(json);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load member profile.");
    } finally {
      setIsLoading(false);
    }
  }, [username, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAction = async (action: string) => {
    if (!data) return;
    setIsBusy(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, targetUserId: data.profile.id }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action}.`);
      }

      setSuccessMessage(json.message || "Action updated.");
      await loadProfile();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to ${action}. Please try again.`);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendRequest = async () => {
    if (!data) return;
    setIsBusy(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target: data.profile.id }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to send friend request.");
      }

      setSuccessMessage(json.message || "Friend request sent!");
      await loadProfile();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send friend request.");
    } finally {
      setIsBusy(false);
    }
  };

  const copyId = () => {
    if (data?.profile.auramindId) {
      navigator.clipboard.writeText(data.profile.auramindId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2200);
    }
  };

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: "80px", textAlign: "center", maxWidth: "800px" }}>
        <span className="badge badge-yellow pulse">Loading Profile...</span>
      </div>
    );
  }

  if (errorMessage && !data) {
    return (
      <div className="container" style={{ paddingTop: "60px", textAlign: "center", maxWidth: "600px" }}>
        <div className="surface" style={{ padding: "40px 24px", borderRadius: "16px" }}>
          <h2 style={{ fontSize: "1.4rem", margin: "0 0 10px" }}>Profile Unavailable</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>{errorMessage}</p>
          <Link href="/friends" className="btn btn-primary">
            &larr; Back to Friends
          </Link>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { profile, friendshipStatus, isMutualFriend, stats, sharedGoals } = data;
  const isSelf = friendshipStatus === "self";

  return (
    <div className="container" style={{ paddingTop: "40px", paddingBottom: "80px", maxWidth: "860px" }}>
      {/* BACK NAVIGATION */}
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/friends"
          style={{
            color: "var(--text-secondary)",
            textDecoration: "none",
            fontSize: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontWeight: 600,
          }}
        >
          &larr; Back to Friends Circle
        </Link>
      </div>

      {/* ALERTS */}
      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: "20px" }}>
          {successMessage}
        </div>
      )}

      {/* PROFILE HEADER CARD */}
      <div
        className="card"
        style={{
          padding: "32px 28px",
          borderRadius: "16px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          marginBottom: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: isMutualFriend ? "3px solid var(--accent-primary)" : "2px solid var(--border-default)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-elevated)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.8rem",
                  fontWeight: 800,
                  border: isMutualFriend ? "3px solid var(--accent-primary)" : "2px solid var(--border-default)",
                }}
              >
                {profile.fullName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
                  {profile.fullName}
                </h1>
                {isMutualFriend && !isSelf && (
                  <span className="badge badge-yellow" style={{ fontSize: "0.75rem" }}>
                    ✓ Accountability Partner
                  </span>
                )}
                {isSelf && (
                  <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                    Your Profile
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 600 }}>
                  @{profile.username}
                </span>
                <button
                  type="button"
                  onClick={copyId}
                  className="badge badge-neutral"
                  style={{ cursor: "pointer", border: "1px solid var(--border-default)", textTransform: "none" }}
                  title="Click to copy unique AuraMind ID"
                >
                  <span>{profile.auramindId}</span>
                  <span style={{ color: copiedId ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "0.7rem", marginLeft: "4px" }}>
                    {copiedId ? "✓" : "copy"}
                  </span>
                </button>
              </div>

              {profile.bio && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "12px 0 0", maxWidth: "540px", lineHeight: 1.5 }}>
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Contextual Action Button */}
          <div>
            {isSelf ? (
              <Link href="/friends?tab=friends" className="btn btn-secondary">
                Manage Settings &rarr;
              </Link>
            ) : friendshipStatus === "accepted" ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <Link
                  href={`/community?tab=private&friendId=${data.profile.id}`}
                  className="btn btn-primary btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span>💬</span>
                  <span>Message</span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleAction("remove")}
                  disabled={isBusy}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "var(--text-secondary)" }}
                  title="Unfriend this member"
                >
                  Unfriend
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("block")}
                  disabled={isBusy}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#EF4444" }}
                  title="Block this member"
                >
                  Block
                </button>
              </div>
            ) : friendshipStatus === "pending_sent" ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="badge badge-neutral">Request Pending</span>
                <button
                  type="button"
                  onClick={() => handleAction("cancel")}
                  disabled={isBusy}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              </div>
            ) : friendshipStatus === "pending_received" ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => handleAction("accept")}
                  disabled={isBusy}
                  className="btn btn-primary btn-sm"
                >
                  Accept Request
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("reject")}
                  disabled={isBusy}
                  className="btn btn-ghost btn-sm"
                >
                  Decline
                </button>
              </div>
            ) : friendshipStatus === "blocked" ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="badge badge-neutral" style={{ color: "#EF4444", borderColor: "#EF4444" }}>
                  Blocked
                </span>
                <button
                  type="button"
                  onClick={() => handleAction("unblock")}
                  disabled={isBusy}
                  className="btn btn-secondary btn-sm"
                >
                  {isBusy ? "Unblocking..." : "Unblock User"}
                </button>
              </div>
            ) : friendshipStatus === "blocked_by" ? (
              <span className="badge badge-neutral">Unavailable</span>
            ) : (
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={isBusy}
                  className="btn btn-primary"
                >
                  {isBusy ? "Sending..." : "+ Add Friend"}
                </button>
                <button
                  type="button"
                  onClick={() => handleAction("block")}
                  disabled={isBusy}
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#EF4444" }}
                  title="Block this member"
                >
                  Block
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACCOUNTABILITY TELEMETRY STATS */}
      {stats && (
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 14px", color: "var(--text-primary)" }}>
            Execution Telemetry
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            <div
              className="card"
              style={{
                padding: "20px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Focus Time Logged
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--accent-primary)", marginTop: "4px" }}>
                {Math.round(stats.totalFocusMin / 60)}h {stats.totalFocusMin % 60}m
              </div>
              <div className="text-xs text-muted" style={{ marginTop: "4px" }}>
                Deep deliberate practice
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "20px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Accountability XP
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                {stats.totalXp} XP
              </div>
              <div className="text-xs text-muted" style={{ marginTop: "4px" }}>
                Discipline &amp; check-in points
              </div>
            </div>

            <div
              className="card"
              style={{
                padding: "20px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Active Trajectories
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
                {stats.activeGoals}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: "4px" }}>
                30-day plans in execution
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MUTUALLY SHARED GOALS & ACCOUNTABILITY */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Shared Goals &amp; Milestones
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Goals this member has explicitly chosen to make visible to their circle.
            </p>
          </div>
          <span className="badge badge-neutral">{sharedGoals.length} Shared</span>
        </div>

        {!isMutualFriend ? (
          <div className="surface" style={{ padding: "40px 24px", textAlign: "center", borderRadius: "14px" }}>
            <span className="badge badge-yellow" style={{ marginBottom: "10px" }}>Friends Only</span>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 6px" }}>Connect to view shared accountability</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "420px", margin: "0 auto 16px" }}>
              Send a friend request to unlock mutually shared goal frameworks, weekly milestone progress, and focus celebrations.
            </p>
            {friendshipStatus === "none" && (
              <button type="button" onClick={handleSendRequest} disabled={isBusy} className="btn btn-primary btn-sm">
                + Add Friend to Connect
              </button>
            )}
          </div>
        ) : sharedGoals.length === 0 ? (
          <div className="surface" style={{ padding: "40px 24px", textAlign: "center", borderRadius: "14px" }}>
            <p style={{ color: "var(--text-secondary)", margin: 0 }}>
              {isSelf
                ? "You haven't shared any goals with your friends circle yet. Open any goal in your dashboard to toggle sharing."
                : `${profile.fullName} has not shared any public goal milestones with friends yet.`}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {sharedGoals.map((g) => (
              <div
                key={g.id}
                className="card"
                style={{
                  padding: "24px",
                  borderRadius: "14px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <span className="badge badge-yellow" style={{ marginBottom: "6px", textTransform: "capitalize" }}>
                      {g.category.replace(/_/g, " ")}
                    </span>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                      {g.goalTitle}
                    </h3>
                  </div>

                  <span className="badge badge-neutral" style={{ fontSize: "0.75rem" }}>
                    Level: {g.currentLevel} &rarr; {g.targetLevel}
                  </span>
                </div>

                {g.sharedCaption && (
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontStyle: "italic", margin: "0 0 14px" }}>
                    &ldquo;{g.sharedCaption}&rdquo;
                  </p>
                )}

                {/* Milestone preview */}
                {g.recentMilestones && g.recentMilestones.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                      Weekly Roadmap &bull; 4 Weeks
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                      {g.recentMilestones.map((m) => (
                        <div
                          key={m.week}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "8px",
                            backgroundColor: "var(--bg-secondary)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: "0.8rem", color: "var(--accent-primary)" }}>
                            Week {m.week}: {m.title}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                            {m.outcome}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FriendProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: "80px", textAlign: "center" }}>
          <span className="badge badge-yellow pulse">Loading Profile...</span>
        </div>
      }
    >
      <FriendProfileContent />
    </Suspense>
  );
}
