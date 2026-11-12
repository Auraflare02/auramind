import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "AI Goal Planner – Create Personalised Goal Plans with AuraMind",
  description:
    "Transform ambitious goals into structured 30-day timetables. Discover how AuraMind's AI breaks down skills, schedules daily deliberate practice, and dynamically adjusts when life happens.",
  path: "/ai-goal-planner",
  keywords: [
    "AI goal planner",
    "personalized goal planning",
    "30-day timetable generator",
    "deliberate practice schedule",
    "AI productivity planning",
    "habit architecture",
    "task decomposition",
  ],
});

export default function AiGoalPlannerPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "AI Goal Planner", path: "/ai-goal-planner" },
  ]);

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh" }}>
      <JsonLd data={breadcrumbs} />

      {/* 1. HERO HEADER */}
      <section
        style={{
          paddingTop: "72px",
          paddingBottom: "56px",
          borderBottom: "1px solid var(--border-default)",
          background: "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 0, 0.09) 0%, rgba(8, 8, 8, 0) 70%)",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
              AI Goal Planning &bull; 30-Day Step-by-Step Timetable
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)", marginBottom: "20px" }}>
            AI Goal Planner – Create Personalised Goal Plans with AuraMind
          </h1>

          <p className="lead" style={{ maxWidth: "720px", margin: "0 auto 36px", color: "var(--text-secondary)" }}>
            Turn ambitious goals into clear, achievable 30-day daily schedules. Tell AuraMind what you want to learn or achieve, your available daily hours, and let AI build your timetable.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/#create-goal" className="btn btn-primary btn-lg">
              Generate 30-Day Timetable &rarr;
            </Link>
            <Link href="/features" className="btn btn-secondary btn-lg">
              Explore All Features
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE CORE PROBLEM */}
      <section style={{ padding: "72px 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ maxWidth: "920px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>
              The Problem with Traditional Planning
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "8px" }}>
              Why 92% of Goals Fail Before Day 14
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "680px", margin: "12px auto 0" }}>
              The human brain is exceptional at imagining inspiring end-states, but notoriously poor at estimating daily friction.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            <div
              className="surface-card"
              style={{
                padding: "24px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "12px" }}>🌫️</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                Cognitive Ambiguity
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Goals like &ldquo;learn Python&rdquo; or &ldquo;build an audience&rdquo; lack operational specificity. When you sit at your desk unsure what to click or write next, decision fatigue triggers procrastination.
              </p>
            </div>

            <div
              className="surface-card"
              style={{
                padding: "24px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "12px" }}>⚖️</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                Unrealistic Scheduling
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                People budget 5 hours of deep work alongside full-time jobs, commute fatigue, and chores. When reality collides with fantasy, the plan collapses within 72 hours.
              </p>
            </div>

            <div
              className="surface-card"
              style={{
                padding: "24px",
                borderRadius: "12px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: "12px" }}>💥</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                Brittle Rigidity
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Traditional paper calendars provide zero flexibility. Missing Day 5 leaves you feeling permanently behind, encouraging complete abandonment instead of rapid recalibration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW AURAMIND'S AI GOAL PLANNER WORKS (STEP-BY-STEP) */}
      <section style={{ padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "980px" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>
              The 5-Step Architecture
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "8px" }}>
              How AuraMind Builds Your 30-Day Execution System
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "700px", margin: "12px auto 0" }}>
              A scientifically grounded process engineered to turn high-level ambition into discrete, daily deliberate practice blocks.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* STEP 1 */}
            <div
              className="surface-card"
              style={{
                padding: "32px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  border: "1px solid rgba(255, 214, 0, 0.3)",
                }}
              >
                01
              </div>
              <div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                  Multi-Factor Goal Ingestion &amp; Constraint Mapping
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "16px" }}>
                  Instead of merely typing a title, you provide AuraMind with real-world operating parameters:
                </p>
                <ul style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, paddingLeft: "20px", margin: 0 }}>
                  <li><strong>Target Objective &amp; Domain:</strong> Coding, exams, languages, fitness, or creative writing.</li>
                  <li><strong>Current vs. Target Proficiency:</strong> From absolute beginner to production-ready professional.</li>
                  <li><strong>Realistic Daily Budget:</strong> Exactly how many hours (1h, 2.5h, 4h+) you can legitimately commit.</li>
                  <li><strong>Peak Cognitive Window:</strong> Morning clarity, afternoon endurance, evening focus, or quiet night sessions.</li>
                  <li><strong>Environmental Distractions:</strong> Flagging social media, smartphone alerts, or multitasking habits so the AI builds compensatory buffers.</li>
                </ul>
              </div>
            </div>

            {/* STEP 2 */}
            <div
              className="surface-card"
              style={{
                padding: "32px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  border: "1px solid rgba(255, 214, 0, 0.3)",
                }}
              >
                02
              </div>
              <div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                  Hierarchical Task Decomposition (Deliberate Practice)
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "16px" }}>
                  AuraMind utilizes advanced language models (Google Gemini) instructed with deliberate practice pedagogy. The AI decomposes your overarching goal into a 4-week progressive scaffold:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
                  <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 700, color: "var(--accent-primary)", fontSize: "0.85rem" }}>Week 1: Setup &amp; Core Concepts</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Environment setup, syntax fundamentals, basic exercises.</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 700, color: "var(--accent-primary)", fontSize: "0.85rem" }}>Week 2: Deep Mechanics</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Intermediate patterns, algorithm challenges, error handling.</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 700, color: "var(--accent-primary)", fontSize: "0.85rem" }}>Week 3: Practical Synthesis</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Building real prototypes, end-to-end integration, mock tests.</div>
                  </div>
                  <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ fontWeight: 700, color: "var(--accent-primary)", fontSize: "0.85rem" }}>Week 4: Polishing &amp; Mastery</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>Performance audits, deployment, edge cases, final review.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div
              className="surface-card"
              style={{
                padding: "32px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  border: "1px solid rgba(255, 214, 0, 0.3)",
                }}
              >
                03
              </div>
              <div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                  Generation of the 30-Day Timetable
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "16px" }}>
                  Each day is populated with concrete, unambiguous instructions. Instead of vague reminders, every entry includes:
                </p>
                <div style={{ padding: "16px", borderRadius: "10px", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-default)", fontFamily: "monospace", fontSize: "0.85rem" }}>
                  <div style={{ color: "var(--accent-primary)", fontWeight: 700, marginBottom: "6px" }}>DAY 7 • FOCUS: RESTful API Architecture</div>
                  <div style={{ color: "#FFFFFF", marginBottom: "4px" }}>• Task 1 (45m): Construct 3 CRUD endpoints in Express using TypeScript types.</div>
                  <div style={{ color: "#FFFFFF", marginBottom: "4px" }}>• Task 2 (45m): Write unit tests covering 400 Bad Request and 404 Not Found errors.</div>
                  <div style={{ color: "var(--text-muted)" }}>• Deliverable: Push working repository commit with passing npm test suite.</div>
                </div>
              </div>
            </div>

            {/* STEP 4 */}
            <div
              className="surface-card"
              style={{
                padding: "32px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  border: "1px solid rgba(255, 214, 0, 0.3)",
                }}
              >
                04
              </div>
              <div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                  Day 1 Immediate-Launch &amp; Progress Monitoring
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "12px" }}>
                  There is no multi-day waiting period. Once generated, you can click <strong>Launch Day 1 Now</strong> to open your active session:
                </p>
                <ul style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6, paddingLeft: "20px", margin: 0 }}>
                  <li>Embedded <strong>Focus Timer</strong> with 25-minute Pomodoro sprints.</li>
                  <li>Real-time <strong>XP allocation</strong> that rewards completed daily tasks.</li>
                  <li>Automated <strong>Hourly Check-in prompts</strong> confirming focus integrity.</li>
                  <li>Integrated <strong>WhatsApp &amp; AI Calling alerts</strong> for Platinum and Diamond users.</li>
                </ul>
              </div>
            </div>

            {/* STEP 5 */}
            <div
              className="surface-card"
              style={{
                padding: "32px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "80px 1fr",
                gap: "24px",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "1.6rem",
                  border: "1px solid rgba(255, 214, 0, 0.3)",
                }}
              >
                05
              </div>
              <div>
                <h3 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                  Adaptive Rescheduling Without Guilt
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, margin: 0 }}>
                  Life inevitably intervenes. When an illness or urgent deadline halts progress for two days, AuraMind does not shame you with broken red streaks. You simply tap <strong>Adapt Timetable</strong>. The AI analyzes unfinished deliverables, redistributes essential tasks into subsequent buffer windows, and re-optimizes the remaining 30-day runway so your target deadline remains achievable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. REAL-WORLD EXAMPLE BLUEPRINTS */}
      <section style={{ padding: "72px 0", backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-default)" }}>
        <div className="container" style={{ maxWidth: "980px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>
              Original Examples
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "8px" }}>
              See How AuraMind Structures Diverse Goals
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            <div className="surface-card" style={{ padding: "28px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>Coding &amp; Software</span>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "10px", color: "#FFFFFF" }}>
                Full-Stack Next.js Developer
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "14px" }}>
                <strong>Inputs:</strong> Beginner JS &bull; 2.5 hours/day &bull; Morning peak &bull; Distraction: Social media notifications.
              </p>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <strong>Generated Architecture:</strong> Week 1 breaks down TypeScript fundamentals; Week 2 covers React Server Components; Week 3 builds Supabase PostgreSQL integrations; Week 4 deploys a live SaaS prototype on Vercel.
              </div>
            </div>

            <div className="surface-card" style={{ padding: "28px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span className="badge badge-yellow" style={{ fontSize: "0.7rem" }}>Academics &amp; Exams</span>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "10px", color: "#FFFFFF" }}>
                Data Structures &amp; Algorithms Mastery
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "14px" }}>
                <strong>Inputs:</strong> Intermediate C++ &bull; 3 hours/day &bull; Evening peak &bull; Distraction: Tab switching.
              </p>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                <strong>Generated Architecture:</strong> Daily 90-minute algorithmic problem solving focused on 2 specific patterns per week (Sliding Window, Binary Search, Trees, DP) paired with active recall and code review.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section style={{ padding: "72px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "700px" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "16px" }}>
            Ready to Generate Your 30-Day Timetable?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "32px" }}>
            Build a system that fits your real schedule. Input your goal and generate an actionable daily execution plan in seconds.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/beta" className="btn btn-primary btn-lg">
              🚀 JOIN THE ₹99 BETA
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">
              Compare Subscription Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
