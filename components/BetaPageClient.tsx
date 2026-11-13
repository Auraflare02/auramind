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
              🚀 LIMITED TO FIRST 100 BETA USERS • 20 DAYS PLATINUM ACCESS
            </span>
          </div>

          <h1
            className="display-title"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", fontWeight: 900, marginBottom: "20px", lineHeight: 1.15 }}
          >
            GET 20 DAYS OF AURAMIND PLATINUM FOR JUST ₹99.
          </h1>

          <p
            className="lead"
            style={{ maxWidth: "760px", margin: "0 auto 32px", color: "var(--text-secondary)", fontSize: "1.15rem", lineHeight: 1.6 }}
          >
            Unlock the complete AuraMind Platinum experience for 20 days: manage up to 3 concurrent goals, connect with 15 friends, receive hourly WhatsApp check-ins, AI calling agent (developer preview), Google Calendar integration, and advanced productivity reports.
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
                Included Plan Tier
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF" }}>
                Full Platinum Tier
              </div>
            </div>
            <div style={{ height: "36px", width: "1px", backgroundColor: "var(--border-default)" }} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                Cohort Cap
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF" }}>
                100 Users Maximum
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
                  title: "Up to 3 Active Goals with Deep AI Research",
                  desc: "Deconstruct up to 3 projects or skills into structured phases with daily task breakdown and milestone checkpoints.",
                },
                {
                  icon: "📅",
                  title: "Personalised 30-Day Daily Timetables",
                  desc: "Daily activities with start/end allocations, task descriptions, and clear deliverables saved securely to Supabase.",
                },
                {
                  icon: "💬",
                  title: "Hourly WhatsApp Check-ins & Alerts",
                  desc: "Proactive WhatsApp messages delivered during scheduled focus blocks to track task execution and prompt check-ins.",
                },
                {
                  icon: "📞",
                  title: "AI Calling Agent (Up to 60 Calls, Preview)",
                  desc: "Up to 60 conversational AI phone calls in Hindi & English to ask about completed tasks, friction, and next steps.",
                },
                {
                  icon: "📅",
                  title: "Basic Google Calendar Integration",
                  desc: "Sync your 30-day goal timetable activities directly to Google Calendar so you never miss scheduled focus blocks.",
                },
                {
                  icon: "🤝",
                  title: "Up to 15 Accountability Friends & World Chat",
                  desc: "Connect with up to 15 friends, exchange private messages, and participate in World Chat with AuraSentinel security moderation.",
                },
                {
                  icon: "⏱️",
                  title: "Focus Timer with Distraction Logging",
                  desc: "Integrated Pomodoro timer (25m, 50m, 90m) that tracks verified focus minutes, logs distractions, and earns progression XP.",
                },
                {
                  icon: "🔄",
                  title: "Missed-Task Adaptive Timetable Recovery",
                  desc: "Life happens. If you miss days, AI dynamically recalculates upcoming days to keep you moving forward without backlog guilt.",
                },
                {
                  icon: "📊",
                  title: "Daily & Advanced Weekly Productivity Reports",
                  desc: "Verified database-backed summaries of focus minutes, task completion percentages, and personalized next-step suggestions.",
                },
                {
                  icon: "🔒",
                  title: "Platinum Limits (Beta vs Diamond Notice)",
                  desc: "Beta includes full Platinum quotas (3 goals, 15 friends, 60 calls). Diamond-exclusive limits (25 goals, 50 friends, 450 calls) are not unlocked.",
                },
                {
                  icon: "🛡️",
                  title: "Zero Hidden Charges & Automatic 20-Day Expiry",
                  desc: "One-time ₹99 payment with zero recurring billing. Your beta access expires automatically after 20 days.",
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
                q: "What features are included in the ₹99 Beta Programme?",
                a: "Every approved beta participant receives the complete AuraMind Platinum experience for 20 days: up to 3 concurrent active goals, up to 15 accountability friends, hourly WhatsApp check-ins, AI voice calling agent (up to 60 calls in Hindi/English, developer preview), basic Google Calendar scheduling, focus timer with distraction logging, XP levels, and advanced weekly reports. Access does not include Diamond-level quotas (25 goals, 50 friends, 450 calls).",
              },
              {
                q: "What happens after the 20 days are over?",
                a: "There are zero auto-renewals or unexpected charges. After 20 days, your Platinum Beta access expires automatically. Your goal history, check-in logs, and progression records remain safely stored in your account. You can choose to upgrade to Gold (₹249/mo), Platinum (₹699/mo), or Diamond (₹1,299/mo) whenever you are ready.",
              },
              {
                q: "How does payment verification work?",
                a: "You scan our official Google Pay UPI QR code for ₹99 and submit your 12-digit UPI Transaction ID (UTR). Our administrative team verifies the bank credit within 6 hours and immediately activates your 20-day Platinum Beta access.",
              },
              {
                q: "What is the status of AI voice calling and WhatsApp check-ins?",
                a: "WhatsApp check-in integration is operational for beta cohorts with connected phone numbers. AI Voice Calling is currently in private developer testing with Bland AI enterprise carrier approval; beta participants are allocated 60 calls which activate under strict 5-minute caps upon carrier clearance.",
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
