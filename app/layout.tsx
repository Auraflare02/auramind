import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { AuraMindLogo } from "@/components/AuraMindBrand";

export const metadata: Metadata = {
  title: "AuraMind — AI Accountability & Goal Execution Platform",
  description: "Don't plan a perfect day. Build a system that learns your real one. Turn ambitious goals into consistent, measurable action.",
  applicationName: "AuraMind",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    google: "google8a203efe90ab4162",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A0A0A" />
        <meta name="google-site-verification" content="google8a203efe90ab4162" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('auramind_theme')||'dark';document.documentElement.setAttribute('data-theme',s);document.documentElement.classList.add(s);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',s==='light'?'#FAFAFA':'#0A0A0A');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {/* RESPONSIVE TOP WORKSPACE NAVIGATION */}
        <Navbar />

        {/* MAIN VIEWPORT */}
        <main style={{ flex: 1 }}>{children}</main>

        {/* MOBILE BOTTOM APP NAVIGATION (Screens <= 768px) */}
        <MobileBottomNav />

        {/* WORKSPACE FOOTER */}
        <footer
          className="workspace-footer"
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
                <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                  <AuraMindLogo height={24} compactOnMobile={false} />
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                  A cognitive architecture platform that transforms ambitions into personalized 30-day deliberate practice schedules, tracks real-time focus metrics, and adapts to reality.
                </p>
              </div>

              <div style={{ display: "flex", gap: "36px", flexWrap: "wrap" }}>
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
                    <Link href="/chat" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      AI Assistant
                    </Link>
                    <Link href="/admin" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Research Console
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Account
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link href="/login" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Login
                    </Link>
                    <Link href="/signup" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Create Account
                    </Link>
                    <Link href="/dashboard" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Dashboard
                    </Link>
                    <Link href="/settings" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Settings
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Legal &amp; Privacy
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link href="/privacy-policy" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Privacy Policy
                    </Link>
                    <Link href="/terms" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Terms &amp; Conditions
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Architecture
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Google Gemini AI
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Supabase PostgreSQL
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Deliberate Practice Science
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
                &copy; {new Date().getFullYear()} AuraMind (Aura Builds). Core Principle: <em>&ldquo;Don&rsquo;t plan a perfect day. Build a system that learns your real one.&rdquo;</em>
              </div>
              <div style={{ display: "flex", gap: "18px" }}>
                <Link href="/privacy-policy" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Privacy Policy</Link>
                <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Terms &amp; Conditions</Link>
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
