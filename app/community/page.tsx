"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { WorldMessage, DirectMessage, DirectConversationSummary } from "@/lib/chat/types";

const QUICK_EMOJIS = ["🔥", "💪", "🎯", "⚡", "👏", "🚀"];

function CommunityChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab State: "world" or "private"
  const initialTab = searchParams.get("tab") === "private" ? "private" : "world";
  const [activeTab, setActiveTab] = useState<"world" | "private">(initialTab);

  // Current Auth User ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ------------------ WORLD CHAT STATE ------------------
  const [worldMessages, setWorldMessages] = useState<WorldMessage[]>([]);
  const [worldInput, setWorldInput] = useState("");
  const [isSendingWorld, setIsSendingWorld] = useState(false);
  const [isWorldLoading, setIsWorldLoading] = useState(true);
  const worldChatBottomRef = useRef<HTMLDivElement>(null);
  const [autoScrollWorld, setAutoScrollWorld] = useState(true);

  // ------------------ DIRECT CHAT STATE ------------------
  const [conversations, setConversations] = useState<DirectConversationSummary[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(
    searchParams.get("friendId") || null
  );
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [directInput, setDirectInput] = useState("");
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [isDirectLoading, setIsDirectLoading] = useState(false);
  const directChatBottomRef = useRef<HTMLDivElement>(null);

  // Error / Status Alert
  const [alertMsg, setAlertMsg] = useState<{ type: "error" | "success" | "security"; text: string; category?: string } | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // 1. Check Authenticated User
  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) {
          router.push("/login?next=/community");
          return;
        }
        const data = await res.json();
        if (data?.user?.id) {
          setCurrentUserId(data.user.id);
        } else {
          router.push("/login?next=/community");
        }
      } catch {
        router.push("/login?next=/community");
      }
    }
    loadAuth();
  }, [router]);

  // ------------------ 2. WORLD CHAT ENGINE ------------------
  const loadWorldMessages = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsWorldLoading(true);
      const res = await fetch("/api/chat/world?limit=80");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setWorldMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn("[world chat load warning]", err);
    } finally {
      if (isInitial) setIsWorldLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorldMessages(true);
    // Real-time live polling every 3 seconds for world room
    const interval = setInterval(() => {
      loadWorldMessages(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadWorldMessages]);

  useEffect(() => {
    if (autoScrollWorld && activeTab === "world") {
      worldChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [worldMessages, autoScrollWorld, activeTab]);

  const handleSendWorld = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = worldInput.trim();
    if (!text || isSendingWorld) return;

    setIsSendingWorld(true);
    setWorldInput("");

    try {
      const res = await fetch("/api/chat/world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        const isSecurity = Boolean(err.blocked || err.botMessage || err.error?.includes("AuraSentinel") || err.error?.includes("blocked"));
        setAlertMsg({
          type: isSecurity ? "security" : "error",
          text: err.botMessage || err.error || "Failed to post message.",
          category: err.category,
        });
        setWorldInput(text); // restore
        setTimeout(() => setAlertMsg(null), 8000);
        return;
      }

      await loadWorldMessages(false);
      worldChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err: any) {
      const isSecurity = err.message?.includes("AuraSentinel") || err.message?.includes("blocked");
      setAlertMsg({
        type: isSecurity ? "security" : "error",
        text: err.message || "Failed to send message.",
      });
      setWorldInput(text); // restore
      setTimeout(() => setAlertMsg(null), 8000);
    } finally {
      setIsSendingWorld(false);
    }
  };

  const handleWorldReaction = async (messageId: string, emoji: string) => {
    try {
      // Optimistic update
      setWorldMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !currentUserId) return m;
          const currentList = m.reactions[emoji] || [];
          const nextList = currentList.includes(currentUserId)
            ? currentList.filter((uid) => uid !== currentUserId)
            : [...currentList, currentUserId];

          const updatedReactions = { ...m.reactions, [emoji]: nextList };
          if (nextList.length === 0) delete updatedReactions[emoji];
          return { ...m, reactions: updatedReactions };
        })
      );

      await fetch("/api/chat/world/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
    } catch (err) {
      console.warn("[reaction error]", err);
    }
  };

  // ------------------ 3. DIRECT CHAT ENGINE ------------------
  const loadConversations = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsConversationsLoading(true);
      const res = await fetch("/api/chat/direct/conversations");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          // Auto select first conversation if none selected
          if (!selectedFriendId && data.conversations.length > 0) {
            setSelectedFriendId(data.conversations[0].friend.id);
          }
        }
      }
    } catch (err) {
      console.warn("[conversations load warning]", err);
    } finally {
      if (isInitial) setIsConversationsLoading(false);
    }
  }, [selectedFriendId]);

  useEffect(() => {
    loadConversations(true);
    const interval = setInterval(() => {
      loadConversations(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const loadDirectMessages = useCallback(async (friendId: string, isInitial = false) => {
    try {
      if (isInitial) setIsDirectLoading(true);
      const res = await fetch(`/api/chat/direct?friendId=${friendId}&limit=100`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setDirectMessages(data.messages);
        }
      }
    } catch (err) {
      console.warn("[direct messages error]", err);
    } finally {
      if (isInitial) setIsDirectLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFriendId) {
      loadDirectMessages(selectedFriendId, true);
      const interval = setInterval(() => {
        loadDirectMessages(selectedFriendId, false);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedFriendId, loadDirectMessages]);

  useEffect(() => {
    if (activeTab === "private") {
      directChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [directMessages, activeTab]);

  const handleSendDirect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = directInput.trim();
    if (!text || !selectedFriendId || isSendingDirect) return;

    setIsSendingDirect(true);
    setDirectInput("");

    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedFriendId, message: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        const isSecurity = Boolean(err.blocked || err.botMessage || err.error?.includes("AuraSentinel") || err.error?.includes("blocked"));
        setAlertMsg({
          type: isSecurity ? "security" : "error",
          text: err.botMessage || err.error || "Failed to send private message.",
          category: err.category,
        });
        setDirectInput(text); // restore
        setTimeout(() => setAlertMsg(null), 8000);
        return;
      }

      await loadDirectMessages(selectedFriendId, false);
      await loadConversations(false);
      directChatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err: any) {
      const isSecurity = err.message?.includes("AuraSentinel") || err.message?.includes("blocked");
      setAlertMsg({
        type: isSecurity ? "security" : "error",
        text: err.message || "Failed to send message.",
      });
      setDirectInput(text); // restore
      setTimeout(() => setAlertMsg(null), 8000);
    } finally {
      setIsSendingDirect(false);
    }
  };

  const activeFriend = conversations.find((c) => c.friend.id === selectedFriendId)?.friend;

  return (
    <div className="container" style={{ paddingTop: "24px", paddingBottom: "72px" }}>
      {/* 1. HEADER & ROOM SWITCHER */}
      <div
        className="flex-between"
        style={{
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
          borderBottom: "1px solid var(--border-default)",
          paddingBottom: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, margin: 0, color: "var(--text-primary)" }}>
              Live Community Chat
            </h1>
            <span className="badge badge-yellow" style={{ fontSize: "0.72rem" }}>
              Real-time
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--accent-primary)",
                backgroundColor: "rgba(255, 214, 0, 0.1)",
                padding: "3px 10px",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 214, 0, 0.3)",
              }}
            >
              <span>🛡️</span>
              <span>AuraSentinel AI Protected</span>
            </span>
            <button
              type="button"
              onClick={() => setShowGuidelines(!showGuidelines)}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: "0.75rem", padding: "3px 8px", textDecoration: "underline" }}
            >
              {showGuidelines ? "Hide Security Rules" : "View Security Rules"}
            </button>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Connect with pioneers in the World room or message accountability partners. Supervised by AuraSentinel AI to enforce goal focus & zero social media sharing.
          </p>
        </div>

        {/* Tab Pills */}
        <div style={{ display: "flex", gap: "8px", backgroundColor: "var(--bg-card)", padding: "4px", borderRadius: "9999px", border: "1px solid var(--border-default)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("world")}
            className={`btn btn-sm ${activeTab === "world" ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>🌐</span>
            <span>World Room</span>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
                display: "inline-block",
              }}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("private")}
            className={`btn btn-sm ${activeTab === "private" ? "btn-primary" : "btn-ghost"}`}
            style={{ borderRadius: "9999px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span>🔒</span>
            <span>Friends Chat</span>
            {conversations.reduce((sum, c) => sum + c.unreadCount, 0) > 0 && (
              <span
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "#000000",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  borderRadius: "9999px",
                  padding: "1px 6px",
                  lineHeight: 1,
                }}
              >
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 1.5 SECURITY GUIDELINES BANNER */}
      {showGuidelines && (
        <div
          className="card"
          style={{
            marginBottom: "20px",
            padding: "18px 22px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--accent-primary)",
            borderRadius: "14px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.3rem" }}>🛡️</span>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
                AuraSentinel AI Security Bot Policy
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowGuidelines(false)}
              className="btn btn-ghost btn-sm"
              style={{ padding: "2px 8px", fontSize: "0.8rem" }}
            >
              ✕ Close
            </button>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            AuraMind is an elite AI goal execution community. AuraSentinel actively monitors all World and Private chat messages in real time to enforce our two golden standards:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--bg-surface)", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.1rem" }}>🚫</span>
                <strong style={{ fontSize: "0.88rem", color: "#EF4444" }}>Rule 1: Zero Social Media Sharing</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                Sharing Instagram, Snapchat, Discord, Telegram, Twitter/X, TikTok, WhatsApp links or handles, phone numbers, or external chat invitations is strictly blocked in both World & Private chats.
              </p>
            </div>
            <div style={{ padding: "14px", borderRadius: "10px", backgroundColor: "var(--bg-surface)", border: "1px solid rgba(255, 214, 0, 0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.1rem" }}>🎯</span>
                <strong style={{ fontSize: "0.88rem", color: "var(--accent-primary)" }}>Rule 2: Strictly On-Topic Goal Focus</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                Discussions must relate to personal goals, learning, coding, fitness, exams, projects, time management, and accountability encouragement. Off-topic dating, gaming lobbies, or political fighting are blocked.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ALERT NOTIFICATION */}
      {alertMsg && (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px 18px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "12px",
            backgroundColor: alertMsg.type === "security" ? "rgba(255, 214, 0, 0.08)" : alertMsg.type === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
            border: alertMsg.type === "security" ? "1px solid var(--accent-primary)" : alertMsg.type === "error" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
            boxShadow: alertMsg.type === "security" ? "0 0 20px rgba(255, 214, 0, 0.15)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>
              {alertMsg.type === "security" ? "🛡️" : alertMsg.type === "error" ? "⚠️" : "✅"}
            </span>
            <div>
              {alertMsg.type === "security" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.82rem", color: "var(--accent-primary)", letterSpacing: "0.03em" }}>
                    AURASENTINEL AI SECURITY BOT
                  </span>
                  <span className="badge badge-yellow" style={{ fontSize: "0.62rem", padding: "1px 6px" }}>
                    Enforcement Active
                  </span>
                </div>
              )}
              <span style={{ fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.45 }}>
                {alertMsg.text}
              </span>
              {alertMsg.type === "security" && (
                <div style={{ marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={() => setShowGuidelines(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-primary)",
                      fontSize: "0.78rem",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    View Community & Security Guidelines &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlertMsg(null)}
            style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.2rem", cursor: "pointer", padding: "0 4px" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROOM 1: WORLD LIVE CHAT (GLOBAL FOR EVERYONE)            */}
      {/* ======================================================== */}
      {activeTab === "world" && (
        <div
          className="card"
          style={{
            height: "72vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: "16px",
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* World Chat Header */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-card)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255, 214, 0, 0.15)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                }}
              >
                🌐
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  Global Pioneer Square
                </h3>
                <span className="text-xs text-muted">
                  Live public room &bull; Share breakthroughs, focus updates, and support peers
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="badge badge-neutral" style={{ fontSize: "0.72rem" }}>
                {worldMessages.length} messages
              </span>
              <button
                type="button"
                onClick={() => loadWorldMessages(true)}
                className="btn btn-ghost btn-sm"
                title="Refresh messages"
                style={{ padding: "4px 8px" }}
              >
                ↻
              </button>
            </div>
          </div>

          {/* World Messages Scroll Feed */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
            onScroll={(e) => {
              const el = e.currentTarget;
              const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
              setAutoScrollWorld(atBottom);
            }}
          >
            {/* Pinned AuraSentinel Security Announcement */}
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 214, 0, 0.06)",
                border: "1px solid rgba(255, 214, 0, 0.22)",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "4px",
              }}
            >
              <div style={{ fontSize: "1.4rem", lineHeight: 1 }}>🛡️</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--accent-primary)" }}>
                    AuraSentinel AI Security Bot
                  </span>
                  <span className="badge badge-yellow" style={{ fontSize: "0.62rem", padding: "1px 6px" }}>
                    Active Guardian
                  </span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                  This room is guarded by AI. <strong>Sharing external social media handles</strong> and <strong>off-topic chat</strong> (dating, politics, crypto, gaming lobbies) are automatically blocked to keep this space focused on goals and accountability.
                </p>
              </div>
            </div>
            {isWorldLoading ? (
              <div style={{ margin: "auto", textAlign: "center", padding: "40px 0" }}>
                <span className="badge badge-yellow pulse">Connecting to World Stream...</span>
              </div>
            ) : worldMessages.length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: "2rem", marginBottom: "10px" }}>👋</div>
                <h3 style={{ margin: "0 0 6px", fontWeight: 700 }}>Welcome to World Chat</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                  Be the first pioneer to drop a message, introduce your 30-day goal, or cheer on the community!
                </p>
              </div>
            ) : (
              worldMessages.map((msg) => {
                const isMe = currentUserId === msg.userId;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      backgroundColor: isMe ? "rgba(255, 214, 0, 0.05)" : "var(--bg-card)",
                      border: isMe ? "1px solid rgba(255, 214, 0, 0.25)" : "1px solid var(--border-subtle)",
                      transition: "border-color var(--transition-fast)",
                    }}
                  >
                    {/* Sender Avatar */}
                    {msg.user?.avatarUrl ? (
                      <img
                        src={msg.user.avatarUrl}
                        alt={msg.user.fullName}
                        referrerPolicy="no-referrer"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: isMe ? "2px solid var(--accent-primary)" : "1px solid var(--border-default)",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "var(--bg-elevated)",
                          color: isMe ? "var(--accent-primary)" : "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.85rem",
                          fontWeight: 800,
                          flexShrink: 0,
                          border: isMe ? "2px solid var(--accent-primary)" : "1px solid var(--border-default)",
                        }}
                      >
                        {msg.user?.fullName?.slice(0, 1).toUpperCase() || "P"}
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                        <Link
                          href={`/friends/${msg.user?.username}`}
                          style={{
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            color: isMe ? "var(--accent-primary)" : "var(--text-primary)",
                            textDecoration: "none",
                          }}
                        >
                          {msg.user?.fullName || "AuraMind Pioneer"}
                        </Link>
                        {msg.user?.username && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                            @{msg.user.username}
                          </span>
                        )}
                        <span className="text-xs text-muted">&bull;</span>
                        <span className="text-xs text-muted">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Message Content */}
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.925rem",
                          lineHeight: 1.5,
                          color: "var(--text-primary)",
                          wordBreak: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {msg.message}
                      </p>

                      {/* Reaction Pills */}
                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", marginTop: "8px" }}>
                        {Object.entries(msg.reactions).map(([emoji, uids]) => {
                          const userReacted = currentUserId ? uids.includes(currentUserId) : false;
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleWorldReaction(msg.id, emoji)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 8px",
                                borderRadius: "9999px",
                                fontSize: "0.75rem",
                                background: userReacted ? "rgba(255, 214, 0, 0.18)" : "var(--bg-elevated)",
                                border: userReacted ? "1px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
                                color: "var(--text-primary)",
                                cursor: "pointer",
                              }}
                            >
                              <span>{emoji}</span>
                              <span style={{ fontWeight: 700 }}>{uids.length}</span>
                            </button>
                          );
                        })}

                        {/* Quick React Picker */}
                        <div style={{ display: "inline-flex", gap: "4px", opacity: 0.85 }}>
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleWorldReaction(msg.id, emoji)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                padding: "2px",
                                transition: "transform var(--transition-fast)",
                              }}
                              title={`React ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={worldChatBottomRef} />
          </div>

          {/* World Input Bar */}
          <form
            onSubmit={handleSendWorld}
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Send a live message to everyone in World Room (Goals & Accountability only)..."
                value={worldInput}
                onChange={(e) => setWorldInput(e.target.value)}
                maxLength={2000}
                className="form-input"
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "8px",
                  backgroundColor: "var(--bg-surface)",
                }}
              />
              <button
                type="submit"
                disabled={isSendingWorld || worldInput.trim().length === 0}
                className="btn btn-primary"
                style={{ height: "44px", padding: "0 20px" }}
              >
                {isSendingWorld ? "Verifying..." : "Send"}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", padding: "0 2px" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span>🛡️</span>
                <span>Protected by AuraSentinel AI &bull; Social media handles & off-topic chat strictly prohibited</span>
              </span>
              <span>{worldInput.length}/2000</span>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* ROOM 2: PRIVATE DIRECT MESSAGES WITH FRIENDS             */}
      {/* ======================================================== */}
      {activeTab === "private" && (
        <div
          className="card"
          style={{
            height: "72vh",
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            borderRadius: "16px",
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--bg-surface)",
            overflow: "hidden",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.4)",
          }}
        >
          {/* LEFT COLUMN: FRIENDS CONVERSATION LIST */}
          <div
            style={{
              borderRight: "1px solid var(--border-default)",
              backgroundColor: "var(--bg-card)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                Friends ({conversations.length})
              </h3>
              <Link href="/friends?tab=search" style={{ fontSize: "0.75rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 700 }}>
                + Add Friend
              </Link>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {isConversationsLoading ? (
                <div style={{ padding: "30px", textAlign: "center" }}>
                  <span className="badge badge-yellow pulse" style={{ fontSize: "0.7rem" }}>Loading Friends...</span>
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ padding: "40px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>🤝</div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>No Friends Connected</h4>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 14px" }}>
                    Add friends in the Friends Circle to unlock encrypted private direct chat.
                  </p>
                  <Link href="/friends?tab=search" className="btn btn-primary btn-sm">
                    Find Friends &rarr;
                  </Link>
                </div>
              ) : (
                conversations.map(({ friend, lastMessage, unreadCount }) => {
                  const isSelected = selectedFriendId === friend.id;
                  return (
                    <div
                      key={friend.id}
                      onClick={() => setSelectedFriendId(friend.id)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        backgroundColor: isSelected ? "var(--bg-elevated)" : "transparent",
                        border: isSelected ? "1px solid var(--accent-border)" : "1px solid transparent",
                        marginBottom: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      {/* Avatar */}
                      {friend.avatarUrl ? (
                        <img
                          src={friend.avatarUrl}
                          alt={friend.fullName}
                          referrerPolicy="no-referrer"
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-default)",
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            backgroundColor: "var(--bg-surface)",
                            color: isSelected ? "var(--accent-primary)" : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.9rem",
                            fontWeight: 800,
                            flexShrink: 0,
                            border: isSelected ? "2px solid var(--accent-primary)" : "1px solid var(--border-default)",
                          }}
                        >
                          {friend.fullName.slice(0, 1).toUpperCase()}
                        </div>
                      )}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {friend.fullName}
                          </span>
                          {lastMessage && (
                            <span className="text-xs text-muted" style={{ fontSize: "0.68rem" }}>
                              {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                          <span
                            style={{
                              fontSize: "0.78rem",
                              color: unreadCount > 0 ? "var(--accent-primary)" : "var(--text-muted)",
                              fontWeight: unreadCount > 0 ? 700 : 400,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              maxWidth: "160px",
                            }}
                          >
                            {lastMessage ? lastMessage.message : `@${friend.username}`}
                          </span>
                          {unreadCount > 0 && (
                            <span
                              style={{
                                backgroundColor: "var(--accent-primary)",
                                color: "#000000",
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                borderRadius: "9999px",
                                minWidth: "16px",
                                height: "16px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 4px",
                                lineHeight: 1,
                              }}
                            >
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTIVE 1-ON-1 CHAT */}
          <div style={{ display: "flex", flexDirection: "column", backgroundColor: "var(--bg-surface)", overflow: "hidden" }}>
            {!selectedFriendId || !activeFriend ? (
              <div style={{ margin: "auto", textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: "10px" }}>🔒</div>
                <h3 style={{ margin: "0 0 6px", fontWeight: 700 }}>Select a Friend to Message</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", margin: 0 }}>
                  Choose an accountability partner from the left panel to open your private chat room.
                </p>
              </div>
            ) : (
              <>
                {/* Active Chat Header */}
                <div
                  style={{
                    padding: "12px 20px",
                    borderBottom: "1px solid var(--border-default)",
                    backgroundColor: "var(--bg-card)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {activeFriend.avatarUrl ? (
                      <img
                        src={activeFriend.avatarUrl}
                        alt={activeFriend.fullName}
                        referrerPolicy="no-referrer"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "2px solid var(--accent-primary)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "var(--bg-elevated)",
                          color: "var(--accent-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.9rem",
                          fontWeight: 800,
                          border: "2px solid var(--accent-primary)",
                        }}
                      >
                        {activeFriend.fullName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                        {activeFriend.fullName}
                      </h4>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                        @{activeFriend.username} &bull; {activeFriend.auramindId}
                      </span>
                    </div>
                  </div>

                  <Link href={`/friends/${activeFriend.username}`} className="btn btn-secondary btn-sm" style={{ fontSize: "0.78rem" }}>
                    View Profile &rarr;
                  </Link>
                </div>

                {/* Direct Messages Scroll Feed */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {/* AuraSentinel Private Chat Guardian Banner */}
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 214, 0, 0.05)",
                      border: "1px solid rgba(255, 214, 0, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>🛡️</span>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                      <strong>AuraSentinel AI:</strong> Private chat is strictly for goal accountability. Off-topic chat & social media handles are prohibited.
                    </span>
                  </div>
                  {isDirectLoading ? (
                    <div style={{ margin: "auto", textAlign: "center" }}>
                      <span className="badge badge-yellow pulse">Loading conversation...</span>
                    </div>
                  ) : directMessages.length === 0 ? (
                    <div style={{ margin: "auto", textAlign: "center", padding: "40px" }}>
                      <div style={{ fontSize: "1.8rem", marginBottom: "8px" }}>✨</div>
                      <h4 style={{ margin: "0 0 6px", fontWeight: 700 }}>Direct Accountability Channel</h4>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "340px", margin: "0 auto" }}>
                        You and {activeFriend.fullName} are connected partners. Start cheering each other on!
                      </p>
                    </div>
                  ) : (
                    directMessages.map((msg) => {
                      const isMe = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            display: "flex",
                            justifyContent: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "70%",
                              padding: "10px 14px",
                              borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                              backgroundColor: isMe ? "var(--accent-primary)" : "var(--bg-card)",
                              color: isMe ? "#0A0A0A" : "var(--text-primary)",
                              border: isMe ? "none" : "1px solid var(--border-default)",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.45, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {msg.message}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                                gap: "4px",
                                marginTop: "4px",
                                fontSize: "0.68rem",
                                color: isMe ? "rgba(0, 0, 0, 0.65)" : "var(--text-muted)",
                              }}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isMe && (
                                <span title={msg.isRead ? "Read" : "Delivered"}>
                                  {msg.isRead ? "✓✓" : "✓"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={directChatBottomRef} />
                </div>

                {/* Direct Input Bar */}
                <form
                  onSubmit={handleSendDirect}
                  style={{
                    padding: "14px 20px",
                    borderTop: "1px solid var(--border-default)",
                    backgroundColor: "var(--bg-card)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input
                      type="text"
                      placeholder={`Direct message ${activeFriend.fullName} (Accountability & Goals only)...`}
                      value={directInput}
                      onChange={(e) => setDirectInput(e.target.value)}
                      maxLength={2000}
                      className="form-input"
                      style={{
                        flex: 1,
                        height: "44px",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-surface)",
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isSendingDirect || directInput.trim().length === 0}
                      className="btn btn-primary"
                      style={{ height: "44px", padding: "0 20px" }}
                    >
                      {isSendingDirect ? "Verifying..." : "Send"}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", padding: "0 2px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span>🛡️</span>
                      <span>AuraSentinel AI Active &bull; Zero external social sharing enforced</span>
                    </span>
                    <span>{directInput.length}/2000</span>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunityChatPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ paddingTop: "80px", textAlign: "center" }}>
          <span className="badge badge-yellow pulse">Loading Live Chat...</span>
        </div>
      }
    >
      <CommunityChatContent />
    </Suspense>
  );
}
