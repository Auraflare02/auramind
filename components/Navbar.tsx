"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuraMindLogo } from "@/components/AuraMindBrand";
import ThemeToggle from "@/components/ThemeToggle";
import AuthNav from "@/components/AuthNav";

interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  username?: string | null;
  auramindId?: string | null;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Load auth & friend requests status for mobile menu
  useEffect(() => {
    async function loadAuthAndMeta() {
      try {
        const res = await fetch("/api/auth/user");
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          if (u) {
            setUser({
              id: u.id,
              name: data.profile?.full_name || u.user_metadata?.full_name || u.email?.split("@")[0] || "Pioneer",
              email: u.email || null,
              avatarUrl: data.profile?.avatar_url || u.user_metadata?.avatar_url || null,
              username: data.profile?.username,
              auramindId: data.profile?.auramind_id,
            });

            // Pending incoming friend requests
            try {
              const fRes = await fetch("/api/friends/data");
              if (fRes.ok) {
                const fData = await fRes.json();
                if (Array.isArray(fData.incomingRequests)) {
                  setPendingRequests(fData.incomingRequests.length);
                }
              }
            } catch {
              // Non-blocking
            }
          } else {
            setUser(null);
          }
        }
      } catch {
        setUser(null);
      }
    }
    loadAuthAndMeta();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMobileMenuOpen(false);
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <>
      <header
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--header-bg)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          transition: "background-color var(--transition-normal), border-color var(--transition-normal)",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "64px",
          }}
        >
          {/* BRAND LOGO */}
          <AuraMindLogo height={28} compactOnMobile={true} />

          {/* DESKTOP NAVIGATION (Hidden on mobile via CSS) */}
          <nav className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/features"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
              }}
            >
              Features
            </Link>
            <Link
              href="/pricing"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>Plans</span>
              <span
                style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  backgroundColor: "rgba(255, 214, 0, 0.15)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(255, 214, 0, 0.3)",
                  borderRadius: "9999px",
                  padding: "1px 6px",
                }}
              >
                ₹249
              </span>
            </Link>
            <Link
              href="/blog"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
              }}
            >
              Blog
            </Link>
            <Link
              href="/chat"
              style={{
                color: "var(--accent-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                transition: "color var(--transition-fast)",
              }}
            >
              AI Assistant
            </Link>
            <Link
              href="/friends"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
              }}
            >
              Friends
            </Link>
            <Link
              href="/community"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
                transition: "color var(--transition-fast)",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <span>Live Chat</span>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  display: "inline-block",
                }}
              />
            </Link>
            <Link
              href="/#create-goal"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "color var(--transition-fast)",
              }}
            >
              Start Goal
            </Link>
            <Link
              href="/#lookup"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "color var(--transition-fast)",
              }}
            >
              Access Request
            </Link>
            <Link
              href="/beta"
              style={{
                color: "#000000",
                textDecoration: "none",
                fontSize: "0.825rem",
                fontWeight: 800,
                padding: "6px 16px",
                borderRadius: "9999px",
                backgroundColor: "var(--accent-primary)",
                border: "1px solid var(--accent-primary)",
                boxShadow: "0 2px 10px rgba(255, 214, 0, 0.25)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all var(--transition-fast)",
              }}
            >
              <span>🚀</span>
              <span>JOIN THE ₹99 BETA</span>
            </Link>

            {/* Desktop Auth Controls */}
            <AuthNav />

            {/* Desktop Theme Switcher */}
            <ThemeToggle />
          </nav>

          {/* MOBILE ACTION CONTROLS (Visible on screens <= 768px) */}
          <div className="mobile-nav-trigger" style={{ display: "none", alignItems: "center", gap: "10px" }}>
            {/* Quick Live Chat Pill on Mobile */}
            <Link
              href="/community"
              aria-label="Open Live Chat"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                position: "relative",
              }}
            >
              <span style={{ fontSize: "1rem" }}>💬</span>
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#10B981",
                  border: "1px solid var(--bg-surface)",
                }}
              />
            </Link>

            {/* Theme Switch on Mobile */}
            <ThemeToggle />

            {/* Animated Hamburger / Close Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: mobileMenuOpen ? "var(--bg-elevated)" : "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                transition: "all var(--transition-fast)",
              }}
            >
              {mobileMenuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE FULL-SCREEN SLIDE DRAWER (Fixed Overlay) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: "64px",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10, 10, 10, 0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            zIndex: 99,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            padding: "20px 20px 96px",
            animation: "mobile-drawer-fade 0.2s ease-out forwards",
          }}
        >
          {/* User Status / Profile Card on Mobile */}
          {user ? (
            <div
              style={{
                padding: "16px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--accent-primary)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      backgroundColor: "var(--bg-elevated)",
                      border: "2px solid var(--accent-primary)",
                      color: "var(--accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.1rem",
                    }}
                  >
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    {user.username ? `@${user.username}` : user.email}
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary btn-sm"
                style={{ fontSize: "0.78rem", padding: "6px 12px" }}
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary"
                style={{ height: "44px", textAlign: "center", fontWeight: 700 }}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ height: "44px", textAlign: "center", fontWeight: 700 }}
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Navigation Items List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link
              href="/#create-goal"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem", color: "var(--accent-primary)" }}>⚡</span>
                <span>Start 30-Day Goal</span>
              </div>
              <span className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>Instant AI</span>
            </Link>

            <Link
              href="/community"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>💬</span>
                <span>Live Community Chat</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10B981" }} />
                <span className="badge badge-success" style={{ fontSize: "0.68rem" }}>Live</span>
              </div>
            </Link>

            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid rgba(255, 214, 0, 0.35)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>🥇</span>
                <span>Subscription Plans</span>
              </div>
              <span className="badge badge-yellow" style={{ fontSize: "0.7rem", fontWeight: 800 }}>
                From ₹249/mo
              </span>
            </Link>

            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>✨</span>
                <span>Platform Features</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/ai-goal-planner"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>🎯</span>
                <span>AI Goal Planner</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/ai-accountability"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>📞</span>
                <span>AI Accountability</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>📚</span>
                <span>Productivity Blog</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>💡</span>
                <span>About AuraMind</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/friends"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>👥</span>
                <span>Friends &amp; Accountability</span>
              </div>
              {pendingRequests > 0 ? (
                <span className="badge badge-yellow" style={{ fontSize: "0.7rem", fontWeight: 800 }}>
                  {pendingRequests} new
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
              )}
            </Link>

            <Link
              href="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>🤖</span>
                <span>AI Cognitive Assistant</span>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: "0.7rem" }}>Gemini</span>
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>📊</span>
                <span>My Dashboard</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>⚙️</span>
                <span>Settings &amp; Calendar</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/#lookup"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.92rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>🔍</span>
                <span>Access Existing Request Code</span>
              </div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>&rarr;</span>
            </Link>

            <Link
              href="/beta"
              onClick={() => setMobileMenuOpen(false)}
              className="mobile-nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 214, 0, 0.12)",
                border: "1px solid var(--accent-primary)",
                color: "#FFFFFF",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "0.92rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.2rem" }}>🚀</span>
                <span>Join the ₹99 Beta (100 Slots)</span>
              </div>
              <span style={{ color: "var(--accent-primary)", fontSize: "0.85rem", fontWeight: 800 }}>&rarr;</span>
            </Link>
          </div>

          {/* Sign Out Action Button at Bottom if logged in */}
          {user && (
            <div style={{ marginTop: "24px" }}>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary"
                style={{ width: "100%", height: "46px", color: "var(--error)", borderColor: "var(--error-border)" }}
              >
                Log Out of AuraMind
              </button>
            </div>
          )}

          {/* Quick Security & Brand Tag */}
          <div style={{ marginTop: "32px", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            AuraMind &bull; Powered by Google Gemini &bull; Secure Focus Architecture
          </div>
        </div>
      )}
    </>
  );
}
