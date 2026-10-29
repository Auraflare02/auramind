"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FriendSummary,
  FriendRequest,
  FriendActivity,
  PublicProfile,
  FriendshipStatus,
  FriendsDashboardData,
} from "@/lib/friends/types";

function FriendsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active tab state
  const initialTab = (searchParams.get("tab") as any) || "friends";
  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search" | "activity" | "blocked">(
    ["friends", "requests", "search", "activity", "blocked"].includes(initialTab) ? initialTab : "friends"
  );
  const [requestSubTab, setRequestSubTab] = useState<"incoming" | "outgoing">("incoming");

  // Dashboard Data
  const [data, setData] = useState<FriendsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ profile: PublicProfile; status: FriendshipStatus }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Busy states for action buttons (key = `${action}_${userId}`)
  const [actionBusyMap, setActionBusyMap] = useState<Record<string, boolean>>({});

  // Privacy Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [privacyDiscoverable, setPrivacyDiscoverable] = useState(true);
  const [privacyShareGoals, setPrivacyShareGoals] = useState(false);
  const [privacyShareStats, setPrivacyShareStats] = useState(true);
  const [privacyAllowRequests, setPrivacyAllowRequests] = useState("everyone");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Confirm Dialog Modal (Remove / Block)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "remove" | "block";
    targetUserId: string;
    targetName: string;
  } | null>(null);

  // Copy AuraMind ID status
  const [copiedId, setCopiedId] = useState(false);

  // 1. Load Friends Dashboard Data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/friends/data");
      if (res.status === 401) {
        router.push("/login?next=/friends");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load friends circle data.");
      }
      const json: FriendsDashboardData = await res.json();
      setData(json);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred loading your friends data.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // 2. Load Current User Settings
  const loadUserSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/friends/settings");
      if (res.ok) {
        const json = await res.json();
        if (json.profile) {
          setMyProfile(json.profile);
          setEditUsername(json.profile.username || "");
          setEditBio(json.profile.bio || "");
          setPrivacyDiscoverable(json.profile.privacyDiscoverable !== false);
          setPrivacyShareGoals(Boolean(json.profile.privacyShareGoals));
          setPrivacyShareStats(json.profile.privacyShareStats !== false);
          setPrivacyAllowRequests(json.profile.privacyAllowRequests || "everyone");
        }
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadUserSettings();
  }, [loadDashboardData, loadUserSettings]);

  // 3. Search Users Handler
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q || q.length < 2) return;

    setIsSearching(true);
    setHasSearched(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Search failed.");
      }
      setSearchResults(json.results || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Error searching members.");
    } finally {
      setIsSearching(false);
    }
  };

  // 4. Friend Request Action (Accept, Reject, Cancel, Remove, Block, Unblock)
  const handleRelationshipAction = async (action: string, targetUserId: string, targetName?: string) => {
    const busyKey = `${action}_${targetUserId}`;
    setActionBusyMap((prev) => ({ ...prev, [busyKey]: true }));
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, targetUserId }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || `Failed to ${action} friendship.`);
      }

      setSuccessMessage(json.message || `Action completed.`);

      // Optimistically refresh data
      await loadDashboardData();

      // If search results are showing, update that user's status
      setSearchResults((prev) =>
        prev.map((item) => {
          if (item.profile.id === targetUserId) {
            let nextStatus: FriendshipStatus = item.status;
            if (action === "accept") nextStatus = "accepted";
            if (action === "reject" || action === "cancel" || action === "remove") nextStatus = "none";
            if (action === "block") nextStatus = "blocked";
            if (action === "unblock") nextStatus = "none";
            return { ...item, status: nextStatus };
          }
          return item;
        })
      );
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to ${action}. Please try again.`);
    } finally {
      setActionBusyMap((prev) => ({ ...prev, [busyKey]: false }));
      setConfirmModal(null);
    }
  };

  // 5. Send Friend Request
  const handleSendRequest = async (targetIdentifier: string) => {
    const busyKey = `send_${targetIdentifier}`;
    setActionBusyMap((prev) => ({ ...prev, [busyKey]: true }));
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target: targetIdentifier }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to send request.");
      }

      setSuccessMessage(json.message || "Friend request sent!");
      await loadDashboardData();

      // Update search results item
      setSearchResults((prev) =>
        prev.map((item) => {
          if (item.profile.id === targetIdentifier || item.profile.username === targetIdentifier) {
            return { ...item, status: "pending_sent" };
          }
          return item;
        })
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send friend request.");
    } finally {
      setActionBusyMap((prev) => ({ ...prev, [busyKey]: false }));
    }
  };

  // 6. Save Privacy & Profile Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsMessage(null);

    try {
      const res = await fetch("/api/friends/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: editUsername,
          bio: editBio,
          privacyDiscoverable,
          privacyShareGoals,
          privacyShareStats,
          privacyAllowRequests,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save settings.");
      }

      setSettingsMessage({ type: "success", text: json.message || "Settings updated successfully." });
      await loadUserSettings();
      setTimeout(() => {
        setShowSettingsModal(false);
        setSettingsMessage(null);
      }, 1500);
    } catch (err: any) {
      setSettingsMessage({ type: "error", text: err.message || "Failed to update settings." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const copyMyAuraMindId = () => {
    if (myProfile?.auramindId) {
      navigator.clipboard.writeText(myProfile.auramindId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2200);
    }
  };

  return (
    <div className="container" style={{ paddingTop: "40px", paddingBottom: "80px", maxWidth: "1080px" }}>
      {/* 1. TOP HEADER & TELEMETRY */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span className="badge badge-yellow">Social Accountability</span>
            {myProfile && (
              <button
                type="button"
                onClick={copyMyAuraMindId}
                className="badge badge-neutral"
                style={{ cursor: "pointer", textTransform: "none", border: "1px solid var(--border-default)" }}
                title="Click to copy your unique AuraMind ID"
              >
                <span>ID: {myProfile.auramindId}</span>
                <span style={{ color: copiedId ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "0.7rem", marginLeft: "4px" }}>
                  {copiedId ? "✓ Copied" : "Copy"}
                </span>
              </button>
            )}
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.03em" }}>
            Accountability Circle
          </h1>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px" }}>
            Connect with friends, track mutual execution streaks, and stay disciplined through peer accountability.
          </p>
        </div>

        {/* TOP CONTROLS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <span>+ Find Friends</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Privacy</span>
          </button>
        </div>
      </div>

      {/* ALERTS */}
      {errorMessage && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <span style={{ fontWeight: 700 }}>Notice:</span> {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: "20px" }}>
          {successMessage}
        </div>
      )}

      {/* 2. NAVIGATION TABS */}
      <div
        className="tabs-nav"
        style={{
          borderBottom: "1px solid var(--border-default)",
          marginBottom: "24px",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("friends")}
          className={`tabs-nav-btn ${activeTab === "friends" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span>My Friends</span>
          <span className="badge badge-neutral" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
            {data?.stats.totalFriends || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`tabs-nav-btn ${activeTab === "requests" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span>Friend Requests</span>
          {(data?.stats.pendingIncomingCount || 0) > 0 ? (
            <span
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#0A0A0A",
                fontWeight: 800,
                fontSize: "0.72rem",
                borderRadius: "9999px",
                padding: "1px 7px",
              }}
            >
              {data?.stats.pendingIncomingCount}
            </span>
          ) : (
            <span className="badge badge-neutral" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>
              {(data?.stats.pendingIncomingCount || 0) + (data?.stats.pendingOutgoingCount || 0)}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`tabs-nav-btn ${activeTab === "search" ? "active" : ""}`}
        >
          <span>Find Members</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("activity")}
          className={`tabs-nav-btn ${activeTab === "activity" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span>Activity</span>
          {(data?.stats.unreadActivitiesCount || 0) > 0 && (
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-primary)",
              }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("blocked")}
          className={`tabs-nav-btn ${activeTab === "blocked" ? "active" : ""}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <span>Blocked</span>
          {(data?.stats.blockedCount || 0) > 0 && (
            <span
              className="badge badge-neutral"
              style={{ fontSize: "0.7rem", padding: "1px 6px", color: "#EF4444", borderColor: "#EF4444" }}
            >
              {data?.stats.blockedCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {isLoading ? (
        <div className="surface" style={{ padding: "60px 24px", textAlign: "center" }}>
          <span className="badge badge-yellow pulse" style={{ marginBottom: "12px" }}>
            Loading Accountability Network...
          </span>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Syncing mutual friendships and accountability streaks...
          </p>
        </div>
      ) : activeTab === "friends" ? (
        /* ================= SECTION A: MY FRIENDS ================= */
        <div>
          {!data || data.friends.length === 0 ? (
            <div
              className="surface"
              style={{
                padding: "60px 24px",
                textAlign: "center",
                borderRadius: "16px",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "1.5rem",
                }}
              >
                👥
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 8px" }}>No friends added yet</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "440px", margin: "0 auto 24px" }}>
                Find your peers on AuraMind and build your private accountability circle to support each other&rsquo;s 30-day goals.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("search")}
                className="btn btn-primary"
              >
                Find Friends &rarr;
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "18px",
              }}
            >
              {data.friends.map((friend) => (
                <div
                  key={friend.id}
                  className="card"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "14px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform var(--transition-fast), border-color var(--transition-fast)",
                  }}
                >
                  <div>
                    {/* Top Row: Avatar & Status */}
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.fullName}
                          referrerPolicy="no-referrer"
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid var(--accent-primary)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--accent-primary)",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                            border: "2px solid var(--border-default)",
                          }}
                        >
                          {friend.fullName.slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link
                          href={`/friends/${friend.username}`}
                          style={{
                            textDecoration: "none",
                            color: "var(--text-primary)",
                            fontSize: "1.05rem",
                            fontWeight: 700,
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {friend.fullName}
                        </Link>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            @{friend.username}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: "0.65rem", padding: "0 5px" }}>
                            {friend.auramindId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    {friend.bio && (
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-secondary)",
                          lineHeight: "1.4",
                          margin: "0 0 14px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {friend.bio}
                      </p>
                    )}

                    {/* Telemetry preview if shared */}
                    {friend.stats && (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          padding: "10px 12px",
                          borderRadius: "8px",
                          backgroundColor: "var(--bg-secondary)",
                          marginBottom: "16px",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>FOCUS LOGGED</div>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--accent-primary)" }}>
                            {Math.round(friend.stats.totalFocusMin / 60)}h {friend.stats.totalFocusMin % 60}m
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>XP EARNED</div>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                            {friend.stats.totalXp} XP
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "auto", flexWrap: "wrap" }}>
                    <Link
                      href={`/friends/${friend.username}`}
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, minWidth: "100px", textAlign: "center" }}
                    >
                      View Profile &rarr;
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: "remove",
                          targetUserId: friend.id,
                          targetName: friend.fullName,
                        })
                      }
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}
                      title="Unfriend this member"
                    >
                      Unfriend
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          type: "block",
                          targetUserId: friend.id,
                          targetName: friend.fullName,
                        })
                      }
                      className="btn btn-ghost btn-sm"
                      style={{ color: "#EF4444", fontSize: "0.78rem" }}
                      title="Block this member"
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "requests" ? (
        /* ================= SECTION B: FRIEND REQUESTS ================= */
        <div>
          {/* Sub-Tabs: Incoming vs Outgoing */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setRequestSubTab("incoming")}
              className={`btn btn-sm ${requestSubTab === "incoming" ? "btn-primary" : "btn-secondary"}`}
            >
              Incoming Requests ({data?.incomingRequests.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setRequestSubTab("outgoing")}
              className={`btn btn-sm ${requestSubTab === "outgoing" ? "btn-primary" : "btn-secondary"}`}
            >
              Sent Requests ({data?.outgoingRequests.length || 0})
            </button>
          </div>

          {requestSubTab === "incoming" ? (
            <div>
              {!data || data.incomingRequests.length === 0 ? (
                <div className="surface" style={{ padding: "48px 24px", textAlign: "center", borderRadius: "14px" }}>
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>No incoming friend requests.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {data.incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="card"
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "14px",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        {req.user.avatarUrl ? (
                          <img
                            src={req.user.avatarUrl}
                            alt={req.user.fullName}
                            referrerPolicy="no-referrer"
                            style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "42px",
                              height: "42px",
                              borderRadius: "50%",
                              backgroundColor: "var(--bg-elevated)",
                              color: "var(--accent-primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                            }}
                          >
                            {req.user.fullName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/friends/${req.user.username}`}
                            style={{
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              textDecoration: "none",
                              fontSize: "1rem",
                            }}
                          >
                            {req.user.fullName}
                          </Link>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            @{req.user.username} &bull; {req.user.auramindId}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleRelationshipAction("accept", req.targetUserId, req.user.fullName)}
                          disabled={actionBusyMap[`accept_${req.targetUserId}`]}
                          className="btn btn-primary btn-sm"
                        >
                          {actionBusyMap[`accept_${req.targetUserId}`] ? "Accepting..." : "Accept"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRelationshipAction("reject", req.targetUserId, req.user.fullName)}
                          disabled={actionBusyMap[`reject_${req.targetUserId}`]}
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {!data || data.outgoingRequests.length === 0 ? (
                <div className="surface" style={{ padding: "48px 24px", textAlign: "center", borderRadius: "14px" }}>
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>No pending outgoing requests.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {data.outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="card"
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "14px",
                        borderRadius: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                          }}
                        >
                          {req.user.fullName.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{req.user.fullName}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            @{req.user.username} &bull; Request Pending
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRelationshipAction("cancel", req.targetUserId)}
                        disabled={actionBusyMap[`cancel_${req.targetUserId}`]}
                        className="btn btn-secondary btn-sm"
                      >
                        {actionBusyMap[`cancel_${req.targetUserId}`] ? "Cancelling..." : "Cancel Request"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === "search" ? (
        /* ================= SECTION C: FIND FRIENDS ================= */
        <div>
          {/* SEARCH BOX */}
          <div className="surface" style={{ padding: "24px", borderRadius: "14px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 8px", fontWeight: 700 }}>Search AuraMind Members</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: "0 0 16px" }}>
              Search by username (e.g. <code>@alex</code>) or unique AuraMind ID (e.g. <code>AM-928173</code>).
            </p>

            <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                placeholder="Search by username or AuraMind ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ flex: 1, height: "44px", borderRadius: "8px" }}
              />
              <button
                type="submit"
                disabled={isSearching || searchQuery.trim().length < 2}
                className="btn btn-primary"
                style={{ height: "44px", padding: "0 22px" }}
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
            </form>
          </div>

          {/* RESULTS */}
          {isSearching ? (
            <div className="surface" style={{ padding: "40px", textAlign: "center" }}>
              <span className="badge badge-yellow pulse">Searching members...</span>
            </div>
          ) : hasSearched && searchResults.length === 0 ? (
            <div className="surface" style={{ padding: "48px 24px", textAlign: "center", borderRadius: "14px" }}>
              <p style={{ color: "var(--text-secondary)", margin: "0 0 8px" }}>
                No members found matching &ldquo;{searchQuery}&rdquo;.
              </p>
              <span className="text-xs text-muted">
                Tip: Verify the spelling or ask your friend for their unique AuraMind ID from their profile.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {searchResults.map(({ profile, status }) => (
                <div
                  key={profile.id}
                  className="card"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.fullName}
                        referrerPolicy="no-referrer"
                        style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--accent-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                        }}
                      >
                        {profile.fullName.slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <Link
                        href={`/friends/${profile.username}`}
                        style={{
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontSize: "1rem",
                        }}
                      >
                        {profile.fullName}
                      </Link>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        @{profile.username} &bull; {profile.auramindId}
                      </div>
                      {profile.bio && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {profile.bio}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contextual Action Button */}
                  <div>
                    {status === "accepted" ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className="badge badge-yellow">✓ Friends</span>
                        <Link href={`/friends/${profile.username}`} className="btn btn-secondary btn-sm">
                          Profile &rarr;
                        </Link>
                      </div>
                    ) : status === "pending_sent" ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span className="badge badge-neutral">Request Sent</span>
                        <button
                          type="button"
                          onClick={() => handleRelationshipAction("cancel", profile.id)}
                          disabled={actionBusyMap[`cancel_${profile.id}`]}
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : status === "pending_received" ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleRelationshipAction("accept", profile.id, profile.fullName)}
                          disabled={actionBusyMap[`accept_${profile.id}`]}
                          className="btn btn-primary btn-sm"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRelationshipAction("reject", profile.id)}
                          className="btn btn-ghost btn-sm"
                        >
                          Decline
                        </button>
                      </div>
                    ) : status === "blocked" ? (
                      <button
                        type="button"
                        onClick={() => handleRelationshipAction("unblock", profile.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendRequest(profile.id)}
                        disabled={actionBusyMap[`send_${profile.id}`]}
                        className="btn btn-primary btn-sm"
                      >
                        {actionBusyMap[`send_${profile.id}`] ? "Sending..." : "+ Add Friend"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "activity" ? (
        /* ================= SECTION D: FRIENDSHIP ACTIVITY ================= */
        <div>
          {!data || data.activities.length === 0 ? (
            <div className="surface" style={{ padding: "48px 24px", textAlign: "center", borderRadius: "14px" }}>
              <p style={{ color: "var(--text-secondary)", margin: 0 }}>No recent friendship activity.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.activities.map((act) => (
                <div
                  key={act.id}
                  className="card"
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    borderRadius: "12px",
                    borderLeft: act.isRead ? "1px solid var(--border-default)" : "3px solid var(--accent-primary)",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {act.type === "request_received"
                      ? "📩"
                      : act.type === "request_accepted"
                      ? "🤝"
                      : act.type === "goal_shared"
                      ? "🎯"
                      : "🎉"}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {act.title}
                    </div>
                    {act.message && (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {act.message}
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-muted">
                    {new Date(act.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ================= SECTION E: BLOCKED MEMBERS ================= */
        <div>
          {!data || !data.blockedUsers || data.blockedUsers.length === 0 ? (
            <div
              className="surface"
              style={{
                padding: "60px 24px",
                textAlign: "center",
                borderRadius: "16px",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "1.5rem",
                }}
              >
                🛡️
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 8px" }}>No blocked members</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "440px", margin: "0 auto" }}>
                You have not blocked any members. Blocked users cannot view your accountability trajectories, search your profile, or send requests.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 4px", color: "var(--text-primary)" }}>
                  Blocked Members ({data.blockedUsers.length})
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                  These members cannot interact with you or see your deliberate practice goals.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "16px",
                }}
              >
                {data.blockedUsers.map((blocked) => (
                  <div
                    key={blocked.id}
                    className="card"
                    style={{
                      padding: "18px 20px",
                      borderRadius: "14px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-default)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {blocked.avatarUrl ? (
                        <img
                          src={blocked.avatarUrl}
                          alt={blocked.fullName}
                          referrerPolicy="no-referrer"
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            opacity: 0.7,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-elevated)",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                          }}
                        >
                          {blocked.fullName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                          {blocked.fullName}
                        </h4>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          @{blocked.username}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRelationshipAction("unblock", blocked.id, blocked.fullName)}
                      disabled={actionBusyMap[`unblock_${blocked.id}`]}
                      className="btn btn-secondary btn-sm"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {actionBusyMap[`unblock_${blocked.id}`] ? "Unblocking..." : "Unblock"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. PRIVACY & SOCIAL SETTINGS MODAL */}
      {showSettingsModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "520px",
              padding: "32px",
              borderRadius: "16px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>Social &amp; Privacy Settings</h2>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                &times;
              </button>
            </div>

            {settingsMessage && (
              <div className={`alert alert-${settingsMessage.type}`} style={{ marginBottom: "16px", fontSize: "0.85rem" }}>
                {settingsMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveSettings}>
              {/* Public Username */}
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" htmlFor="edit-username">
                  Public Username
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                      fontWeight: 700,
                    }}
                  >
                    @
                  </span>
                  <input
                    id="edit-username"
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="form-input"
                    style={{ paddingLeft: "30px", height: "42px", borderRadius: "8px" }}
                  />
                </div>
                <div className="text-xs text-muted" style={{ marginTop: "4px" }}>
                  Your unique handle for public profile links: <code>/friends/{editUsername}</code>
                </div>
              </div>

              {/* Bio */}
              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label className="form-label" htmlFor="edit-bio">
                  Accountability Bio
                </label>
                <textarea
                  id="edit-bio"
                  rows={2}
                  maxLength={300}
                  placeholder="e.g. Preparing for System Design interview & daily 2h Python deep work."
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="form-input"
                  style={{ borderRadius: "8px", resize: "none" }}
                />
              </div>

              {/* Toggles */}
              <div
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  padding: "16px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.875rem", display: "block" }}>Discoverable via Search</strong>
                    <span className="text-xs text-muted">Allow others to find your profile via username or AuraMind ID</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyDiscoverable}
                    onChange={(e) => setPrivacyDiscoverable(e.target.checked)}
                    style={{ accentColor: "var(--accent-primary)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.875rem", display: "block" }}>Share Goals with Friends</strong>
                    <span className="text-xs text-muted">Allow accepted friends to see goals you mark as shared</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyShareGoals}
                    onChange={(e) => setPrivacyShareGoals(e.target.checked)}
                    style={{ accentColor: "var(--accent-primary)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.875rem", display: "block" }}>Share Daily Focus Stats</strong>
                    <span className="text-xs text-muted">Display focus minutes logged and XP to your friends circle</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacyShareStats}
                    onChange={(e) => setPrivacyShareStats(e.target.checked)}
                    style={{ accentColor: "var(--accent-primary)", width: "18px", height: "18px", cursor: "pointer" }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="btn btn-secondary"
                  disabled={isSavingSettings}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. CONFIRM ACTION MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "28px",
              borderRadius: "14px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", margin: "0 0 10px" }}>
              {confirmModal.type === "remove" ? "Unfriend Member?" : "Block Member?"}
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0 0 24px" }}>
              {confirmModal.type === "remove"
                ? `Are you sure you want to unfriend ${confirmModal.targetName}? You will both be removed from each other's circle and will no longer see mutual goals or practice telemetry.`
                : `Are you sure you want to block ${confirmModal.targetName}? They will be removed from your friends, unable to find your profile, or send you requests.`}
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRelationshipAction(confirmModal.type, confirmModal.targetUserId, confirmModal.targetName)}
                className="btn btn-primary"
                style={{ backgroundColor: "#EF4444", borderColor: "#EF4444", color: "#FFFFFF" }}
              >
                {confirmModal.type === "remove" ? "Yes, Unfriend" : "Yes, Block User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FriendsPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: "80px", textAlign: "center" }}>
          <span className="badge badge-yellow pulse">Loading Accountability Network...</span>
        </div>
      }
    >
      <FriendsContent />
    </Suspense>
  );
}
