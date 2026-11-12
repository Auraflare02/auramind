"use client";

import Link from "next/link";
import { AuraMindLogo, AuraMindSymbol } from "@/components/AuraMindBrand";

export default function BetaPageClient() {
  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh" }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          paddingTop: "72px",
          paddingBottom: "64px",
          borderBottom: "1px solid var(--border-default)",
          background: "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 0, 0.12) 0%, rgba(8, 8, 8, 0) 70%)",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <span
              className="badge badge-yellow"
              style={{ fontSize: "0.85rem", padding: "6px 14px", fontWeight: 800, letterSpacing: "0.04em" }}
            >
              🚀 LIMITED TO FIRST 100 BETA USERS • 20 DAYS ACCESS
            </span>
          </div>

          <h1
            className="display-title"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.6rem)", fontWeight: 900, marginBottom: "20px", lineHeight: 1.15 }}
          >
            AuraMind 100-User Beta Programme
          </h1>

          <p
            className="lead"
            style={{ maxWidth: "700px", margin: "0 auto 32px", color: "var(--text-secondary)", fontSize: "1.15rem", lineHeight: 1.6 }}
          >
            Experience our core AI goal planning and daily accountability system. Get a personalized 30-day timetable, hourly task check-ins, focus tracking, and missed-task recovery for a one-time ₹99 participation fee.
          </p>

          {/* Pricing Highlight Box */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "20px",
              backgroundColor: "rgba(255, 214, 0, 0.08)",
              border: "1px solid var(--accent-primary)",
              borderRadius: "16px",
              padding: "16px 28px",
              marginBottom: "36px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                One-Time Beta Fee
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--accent-primary)", lineHeight: 1.1 }}>
                ₹99 <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500 }}>for 20 Days</span>
              </div>
            </div>
            <div style={{ height: "36px", width: "1px", backgroundColor: "var(--border-default)" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Availability
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF" }}>
                100 Pioneer Slots Only
              </div>
            </div>
            <div style={{ height: "36px", width: "1px", backgroundColor: "var(--border-default)" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Renewal Policy
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10B981" }}>
                Zero Auto-Renewals
              </div>
            </div>
          </div>

          <div>
            <Link
              href="/beta/checkout"
              className="btn btn-primary btn-lg"
              style={{
                fontSize: "1.1rem",
                fontWeight: 900,
                padding: "16px 36px",
                borderRadius: "9999px",
                boxShadow: "0 4px 20px rgba(255, 214, 0, 0.35)",
              }}
            >
              JOIN THE ₹99 BETA NOW &rarr;
            </Link>
          </div>
          <div style={{ marginTop: "12px", fontSize: "0.825rem", color: "var(--text-muted)" }}>
            Instant access workflow • UPI QR payment verification within 6 hours
          </div>
        </div>
      </section>

      {/* 2. WHAT IS AURAMIND & HOW IT WORKS */}
      <section style={{ padding: "80px 0", borderBottom: "1px solid var(--border-default)" }}>
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>
              How It Works
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0 0 12px" }}>
              A System That Learns Your Real Schedule
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "640px", margin: "0 auto" }}>
              Traditional apps give you a static to-do list that fails the moment life gets busy. AuraMind helps you plan realistic days and recover when you miss a task.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Step 1 */}
            <div
              className="card"
              style={{
                backgroundColor: "#121212",
                border: "1px solid var(--border-default)",
                padding: "28px",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-primary)",
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  marginBottom: "16px",
                }}
              >
                1
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                AI Goal Planning
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Submit any target: learning programming, preparing for exams, or mastering a skill. The AI analyzes your available daily hours and experience level to generate a realistic plan.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className="card"
              style={{
                backgroundColor: "#121212",
                border: "1px solid var(--border-default)",
                padding: "28px",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-primary)",
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  marginBottom: "16px",
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                30-Day Daily Timetable
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                Every single day has concrete scheduled activities, estimated duration, priorities, and expected outcomes. The timetable is saved securely to the database.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className="card"
              style={{
                backgroundColor: "#121212",
                border: "1px solid var(--border-default)",
                padding: "28px",
                borderRadius: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-primary)",
                  fontWeight: 900,
                  fontSize: "1.2rem",
                  marginBottom: "16px",
                }}
              >
                3
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px", color: "#FFFFFF" }}>
                Hourly Check-ins &amp; Recovery
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                AuraMind prompts you during scheduled tasks: Did you complete it? If you miss a task, it diagnoses what happened and updates future days to keep you on track without guilt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHAT'S INCLUDED IN THE ₹99 BETA */}
      <section style={{ padding: "80px 0", backgroundColor: "#0C0C0C", borderBottom: "1px solid var(--border-default)" }}>
        <div className="container" style={{ maxWidth: "900px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>
              Beta Deliverables
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, margin: "0 0 12px" }}>
              What You Receive for ₹99
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Complete access to AuraMind&rsquo;s core productivity suite for 20 days.
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#141414",
              border: "1px solid var(--border-default)",
              borderRadius: "16px",
              padding: "36px",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
              {[
                {
                  icon: "🎯",
                  title: "1 Active Goal with Deep AI Research",
                  desc: "Deconstruct your chosen skill or project into 4 structured phases with milestone checkpoints.",
                },
                {
                  icon: "📅",
                  title: "Personalized 30-Day Timetable",
                  desc: "Daily activities with time allocations, task descriptions, and clear deliverables saved to your profile.",
                },
                {
                  icon: "🚀",
                  title: "Start Goal System",
                  desc: "One-click activation that kicks off Day 1 with initial XP bonus and progress tracking.",
                },
                {
                  icon: "⏱️",
                  title: "Focus Timer with Distraction Logging",
                  desc: "Built-in 25m, 50m, 90m deep-work timer that logs focused minutes and earns progression XP.",
                },
                {
                  icon: "🔔",
                  title: "Application Check-ins & Prompts",
                  desc: "In-app check-ins during your active focus hours to log task completion, partial progress, or friction.",
                },
                {
                  icon: "🔄",
                  title: "Missed-Task Adaptive Recovery",
                  desc: "Never fall off the wagon. If you miss days, AI dynamically recalculates future days so you catch up.",
                },
                {
                  icon: "📊",
                  title: "Daily & Weekly Progress Reports",
                  desc: "Real database-backed summaries of focus minutes, tasks completed, obstacles, and next-day suggestions.",
                },
                {
                  icon: "🤝",
                  title: "Add Up to 5 Accountability Friends",
                  desc: "Connect with up to 5 friends, exchange private messages, and celebrate daily consistency together.",
                },
                {
                  icon: "💬",
                  title: "Priority Engineering Feedback Channel",
                  desc: "Direct feedback form to the engineering team. Report bugs, suggest features, and shape the final product.",
                },
                {
                  icon: "🛡️",
                  title: "Zero Hidden Charges or Auto-Renewals",
                  desc: "One-time ₹99 payment. No surprise charges. Your data stays safe and accessible after beta.",
                },
              ].map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.4rem", lineHeight: 1.2 }}>{item.icon}</span>
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px", color: "#FFFFFF" }}>
                      {item.title}
                    </h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. BETA PARTICIPANT EXPECTATIONS */}
      <section style={{ padding: "80px 0", borderBottom: "1px solid var(--border-default)" }}>
        <div className="container" style={{ maxWidth: "800px", textAlign: "center" }}>
          <span className="badge badge-yellow" style={{ marginBottom: "12px" }}>
            Beta Expectations
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "16px" }}>
            Why We Are Running a Paid 100-User Beta
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "28px" }}>
            We want serious learners who genuinely want to build consistency on a real goal. The ₹99 fee covers our server and AI infrastructure while ensuring every participant is committed to using the system daily and providing honest feedback.
          </p>

          <div
            style={{
              backgroundColor: "#161616",
              border: "1px solid var(--border-default)",
              borderRadius: "12px",
              padding: "24px",
              textAlign: "left",
              marginBottom: "36px",
            }}
          >
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "12px" }}>
              What We Ask From Beta Testers:
            </h4>
            <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.8, paddingLeft: "20px", margin: 0 }}>
              <li>Pick 1 real goal you genuinely want to accomplish over the next 20 to 30 days.</li>
              <li>Log your daily focus blocks and respond honestly to hourly check-ins.</li>
              <li>Report any bugs, incorrect timetables, or confusing UI using the built-in feedback button.</li>
              <li>Give us your honest feedback so we can refine the product before public launch.</li>
            </ul>
          </div>

          <Link
            href="/beta/checkout"
            className="btn btn-primary btn-lg"
            style={{ fontSize: "1.05rem", fontWeight: 800, padding: "14px 32px" }}
          >
            CLAIM YOUR BETA SLOT NOW (₹99) &rarr;
          </Link>
        </div>
      </section>

      {/* 5. FAQ FOR BETA */}
      <section style={{ padding: "72px 0" }}>
        <div className="container" style={{ maxWidth: "760px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, textAlign: "center", marginBottom: "36px" }}>
            Beta Programme FAQ
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              {
                q: "What happens after the 20 days are over?",
                a: "There are no recurring charges. After 20 days, your beta period concludes. Your goals, check-in history, and progress records remain permanently saved in your account. You can optionally upgrade to Gold, Platinum, or Diamond if you wish to continue.",
              },
              {
                q: "How does payment verification work?",
                a: "You scan our official Google Pay UPI QR code and submit the 12-digit transaction reference (UTR). Our administrative team verifies the reference against incoming bank credits within 6 hours and immediately activates your beta status.",
              },
              {
                q: "Is WhatsApp and phone calling included in this ₹99 beta?",
                a: "This beta focuses on the core AI accountability system: 30-day timetable generation, app check-ins, focus tracking, and recovery. WhatsApp and voice calling integrations are being tested in controlled batches with separate carrier approval.",
              },
              {
                q: "What if I encounter an error or confusing feature?",
                a: "A dedicated Beta Feedback button is present on your dashboard. Submissions go directly to our engineering team with critical, high, medium, and low priority triage.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#121212",
                  border: "1px solid var(--border-default)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#FFFFFF", marginBottom: "8px" }}>
                  {faq.q}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "48px" }}>
            <Link href="/beta/checkout" className="btn btn-primary btn-lg" style={{ fontWeight: 800 }}>
              JOIN THE ₹99 BETA &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
