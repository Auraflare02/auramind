import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AuraMind — AI Accountability & Goal Execution Platform",
  description: "Don't plan a perfect day. Build a system that learns your real one. Turn ambitious goals into consistent, measurable action.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0A0A" />
      </head>
      <body>
        {/* TOP WORKSPACE NAVIGATION */}
        <header
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            backgroundColor: "rgba(10, 10, 10, 0.92)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
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
            {/* BRAND */}
            <Link
              href="/"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "15px",
                  color: "#0A0A0A",
                  boxShadow: "0 0 12px rgba(255, 214, 0, 0.25)",
                }}
              >
                A
              </div>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                }}
              >
                AuraMind
              </span>
            </Link>

            {/* NAV LINKS */}
            <nav style={{ display: "flex", alignItems: "center", gap: "20px" }}>
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
                href="/admin"
                style={{
                  color: "#F5F5F5",
                  textDecoration: "none",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  padding: "6px 18px",
                  borderRadius: "9999px",
                  backgroundColor: "#171717",
                  border: "1px solid #303030",
                  transition: "all var(--transition-fast)",
                }}
              >
                Admin
              </Link>

              {/* Status Indicator */}
              <div
                className="badge badge-neutral"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  display: "none",
                }}
              >
                <span className="badge-dot" style={{ backgroundColor: "var(--success)" }} />
                <span>Engine Active</span>
              </div>
            </nav>
          </div>
        </header>

        {/* MAIN VIEWPORT */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* WORKSPACE FOOTER */}
        <footer
          style={{
            borderTop: "1px solid var(--border-subtle)",
            padding: "48px 0 36px",
            backgroundColor: "var(--bg-secondary)",
            marginTop: "auto",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              <div style={{ maxWidth: "420px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "4px",
                      backgroundColor: "var(--accent-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "11px",
                      color: "#0A0A0A",
                    }}
                  >
                    A
                  </div>
                  <strong style={{ fontSize: "1rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                    AuraMind Platform
                  </strong>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  A cognitive architecture platform that transforms ambitions into personalized 30-day deliberate practice schedules, tracks real-time focus metrics, and adapts to reality.
                </p>
              </div>

              <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Workspace
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link href="/#create-goal" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      New 30-Day Goal
                    </Link>
                    <Link href="/#lookup" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Open Existing Request
                    </Link>
                    <Link href="/admin" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Research Console
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Integrations
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Google Gemini AI Models
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Supabase PostgreSQL
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Cognitive Science Framework
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: "24px",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              <div>
                &copy; {new Date().getFullYear()} AuraMind. Core Principle: <em>&ldquo;Don&rsquo;t plan a perfect day. Build a system that learns your real one.&rdquo;</em>
              </div>
              <div style={{ display: "flex", gap: "16px" }}>
                <a href="#how-it-works" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Methodology</a>
                <a href="#create-goal" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Start Free</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
