import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { AuraMindLogo } from "@/components/AuraMindBrand";
import JsonLd from "@/components/seo/JsonLd";
import {
  SITE_URL,
  getOrganizationSchema,
  getWebSiteSchema,
  getSoftwareApplicationSchema,
} from "@/lib/seo/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AuraMind AI – Your Personal AI Accountability & Productivity Assistant",
    template: "%s | AuraMind AI",
  },
  description:
    "Discover AuraMind, an AI-powered productivity and accountability platform that helps you set goals, create personalised schedules, track progress and stay consistent.",
  applicationName: "AuraMind",
  keywords: [
    "AuraMind",
    "AuraMind AI",
    "AI Accountability Assistant",
    "AI Productivity App",
    "AI Goal Planner",
    "30-day timetable",
    "WhatsApp accountability",
    "AI Calling Assistant",
  ],
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
        <JsonLd data={[getOrganizationSchema(), getWebSiteSchema(), getSoftwareApplicationSchema()]} />
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
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
                  Your Personal AI Accountability Assistant. AuraMind helps you create personalized 30-day goal plans, stay accountable with AI check-ins, and track verifiable focus progress.
                </p>
              </div>

              <div style={{ display: "flex", gap: "36px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Platform
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link href="/beta" style={{ color: "var(--accent-primary)", fontSize: "0.85rem", textDecoration: "none", fontWeight: 800 }}>
                      🚀 Join ₹99 Beta (Platinum)
                    </Link>
                    <Link href="/features" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Features
                    </Link>
                    <Link href="/ai-goal-planner" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      AI Goal Planner
                    </Link>
                    <Link href="/ai-accountability" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      AI Accountability
                    </Link>
                    <Link href="/pricing" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Subscription Pricing
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Company &amp; Guides
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link href="/about" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      About AuraMind
                    </Link>
                    <Link href="/blog" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Productivity Blog
                    </Link>
                    <Link href="/faq" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      FAQ &amp; Help
                    </Link>
                    <Link href="/contact" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Contact Support
                    </Link>
                    <Link href="/refund-policy" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Refund Policy
                    </Link>
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
                    Workspace
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Link href="/#create-goal" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Start 30-Day Goal
                    </Link>
                    <Link href="/chat" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      AI Assistant
                    </Link>
                    <Link href="/login" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Login
                    </Link>
                    <Link href="/signup" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Create Account
                    </Link>
                    <Link href="/dashboard" style={{ color: "var(--text-secondary)", fontSize: "0.85rem", textDecoration: "none" }}>
                      Dashboard
                    </Link>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                    Technology
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Google Gemini AI
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Supabase Cloud Database
                    </span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Adaptive Goal Scheduling
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
