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
        <header
          style={{
            borderBottom: "1px solid var(--border-color)",
            backgroundColor: "rgba(10, 10, 10, 0.9)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
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
                  backgroundColor: "var(--yellow-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "16px",
                  color: "#0A0A0A",
                }}
              >
                A
              </div>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                }}
              >
                Aura<span style={{ color: "var(--yellow-primary)" }}>Mind</span>
              </span>
            </Link>

            <nav style={{ display: "flex", alignItems: "center", gap: "18px" }}>
              <Link
                href="/#create-goal"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  transition: "color 0.15s ease",
                }}
              >
                New Goal
              </Link>
              <Link
                href="/#lookup"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  transition: "color 0.15s ease",
                }}
              >
                Check Request
              </Link>
              <Link
                href="/admin"
                style={{
                  color: "var(--text-secondary)",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                }}
              >
                Admin
              </Link>
            </nav>
          </div>
        </header>

        <main style={{ minHeight: "calc(100vh - 140px)" }}>{children}</main>

        <footer
          style={{
            borderTop: "1px solid var(--border-color)",
            padding: "32px 0",
            backgroundColor: "var(--bg-secondary)",
            marginTop: "60px",
          }}
        >
          <div
            className="container"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              textAlign: "center",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>
              AuraMind &copy; {new Date().getFullYear()} &mdash; "Don't plan a perfect day. Build a system that learns your real one."
            </p>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Powered by Google Gemini &amp; Learning Science. Black &amp; Yellow Edition.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
