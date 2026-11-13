import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "AI Accountability Assistant – Stay Consistent with AuraMind",
  description:
    "Discover how AuraMind's AI accountability assistant bridges the intention-action gap through hourly app check-ins, WhatsApp accountability messages, and conversational AI phone calls.",
  path: "/ai-accountability",
  keywords: [
    "AI accountability assistant",
    "AI accountability partner",
    "hourly productivity check-in",
    "WhatsApp accountability reminders",
    "AI calling assistant",
    "goal consistency app",
    "habit accountability AI",
  ],
});

export default function AiAccountabilityPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "AI Accountability", path: "/ai-accountability" },
  ]);

  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <JsonLd data={breadcrumbs} />

      {/* 1. HERO SECTION */}
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
              Proactive Behavioral Defense &bull; Never Settle For Forgotten Goals
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)", marginBottom: "20px" }}>
            AI Accountability Assistant – Stay Consistent with AuraMind
          </h1>

          <p className="lead" style={{ maxWidth: "720px", margin: "0 auto 36px", color: "var(--text-secondary)" }}>
            Passive to-do apps silently watch you procrastinate. AuraMind proactively engages you with hourly check-ins, WhatsApp prompts, and conversational AI phone calls to ensure your ambitions become reality.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pricing" className="btn btn-primary btn-lg">
              Explore Accountability Plans &rarr;
            </Link>
            <Link href="/ai-goal-planner" className="btn btn-secondary btn-lg">
              How Goal Planning Works
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE PSYCHOLOGY OF ACCOUNTABILITY */}
      <section style={{ padding: "72px 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ maxWidth: "940px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>
              Behavioral Science
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "8px" }}>
              The 95% Accountability Phenomenon
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "680px", margin: "12px auto 0" }}>
              Research conducted by the American Society of Training and Development (ASTD) proves that setting an intention only yields a 25% completion rate. But having a regular accountability appointment with a dedicated partner elevates goal completion to <strong>95%</strong>.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)", textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "8px" }}>10%</div>
              <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Having an Idea</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Thinking &ldquo;I should learn this skill&rdquo; without committing to a timeline.</div>
            </div>

            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)", textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--text-muted)", marginBottom: "8px" }}>40%</div>
              <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Setting a Deadline</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Writing down a target date without daily operational support.</div>
            </div>

            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)", textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--text-secondary)", marginBottom: "8px" }}>65%</div>
              <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>Public Commitment</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Telling a friend or family member about your ambition.</div>
            </div>

            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "rgba(255, 214, 0, 0.08)", border: "1px solid rgba(255, 214, 0, 0.4)", textAlign: "center" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--accent-primary)", marginBottom: "8px" }}>95%</div>
              <div style={{ fontWeight: 700, color: "var(--text)", marginBottom: "6px" }}>AuraMind Accountability</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Proactive hourly check-ins, WhatsApp prompts, and AI calling appointments.</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE THREE TIERS OF ACTIVE ACCOUNTABILITY */}
      <section style={{ padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "1020px" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>
              Multi-Channel Intervention
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginTop: "8px" }}>
              How AuraMind Keeps You Anchored to Your Goals
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "700px", margin: "12px auto 0" }}>
              Accountability that meets you where you live: inside your browser, in your WhatsApp inbox, and directly on phone calls.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
            {/* PILLAR 1: HOURLY APP CHECK-INS */}
            <div
              className="surface-card"
              style={{
                padding: "36px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "36px",
                alignItems: "center",
              }}
            >
              <div>
                <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "12px" }}>
                  Gold &bull; Platinum &bull; Diamond
                </span>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
                  1. Hourly Productivity Check-ins
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "16px" }}>
                  When your scheduled focus window arrives, AuraMind delivers gentle, non-intrusive notifications across your device.
                </p>
                <ul style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6, paddingLeft: "18px", margin: 0 }}>
                  <li><strong>Prompt:</strong> &ldquo;Hey Pioneer! Did you finish your 45-minute Next.js API task?&rdquo;</li>
                  <li><strong>1-Tap Confirmation:</strong> Confirm with a single tap to claim XP and advance your daily rank.</li>
                  <li><strong>Distraction Flags:</strong> If interrupted, indicate the friction point to calibrate future focus blocks.</li>
                </ul>
              </div>

              <div
                style={{
                  padding: "24px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  fontFamily: "monospace",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--success)" }} />
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>AuraMind Check-in System</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>14:00</span>
                </div>
                <div style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>
                  Scheduled Focus Block: <strong>Data Structures Tree Traversal (Day 8)</strong>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "var(--success)", textAlign: "center", fontWeight: 700 }}>
                    Completed (+50 XP)
                  </div>
                  <div style={{ padding: "10px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", textAlign: "center" }}>
                    Reschedule (+0 XP)
                  </div>
                </div>
              </div>
            </div>

            {/* PILLAR 2: WHATSAPP ACCOUNTABILITY */}
            <div
              className="surface-card"
              style={{
                padding: "36px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "36px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  padding: "24px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontFamily: "sans-serif",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--on-accent)", fontWeight: 800 }}>AM</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text)" }}>AuraMind AI Accountability</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--success)" }}>Official Verified Partner</div>
                  </div>
                </div>
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--card)", color: "var(--text)", marginBottom: "10px", maxWidth: "85%" }}>
                  🌅 <strong>Morning Briefing (Day 14)</strong><br />
                  Good morning! Today you have 2 scheduled focus blocks (2.5h total):<br />
                  • 09:00 AM: Docker Containerization Module<br />
                  • 04:30 PM: Compose File Practice<br />
                  Ready to conquer Day 14? Reply <strong>READY</strong> to activate your sprint!
                </div>
                <div style={{ padding: "12px", borderRadius: "8px", backgroundColor: "var(--card)", color: "var(--text)", marginLeft: "auto", maxWidth: "60%", textAlign: "right" }}>
                  READY! Let&rsquo;s do it.
                </div>
              </div>

              <div>
                <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "12px" }}>
                  Platinum &bull; Diamond Exclusive
                </span>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
                  2. WhatsApp Check-in Messaging
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "16px" }}>
                  You don&rsquo;t need to remember to check a website. AuraMind reaches you directly through WhatsApp, eliminating digital friction:
                </p>
                <ul style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6, paddingLeft: "18px", margin: 0 }}>
                  <li><strong>Morning Operational Briefs:</strong> Overview of upcoming tasks and milestones for the day.</li>
                  <li><strong>Upcoming Block Reminders:</strong> Nudges 15 minutes before your scheduled focus time.</li>
                  <li><strong>Evening Debriefs:</strong> Summarizing completed activities and logging your streak.</li>
                </ul>
              </div>
            </div>

            {/* PILLAR 3: AI CALLING ASSISTANT */}
            <div
              className="surface-card"
              style={{
                padding: "36px",
                borderRadius: "14px",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "36px",
                alignItems: "center",
              }}
            >
              <div>
                <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "12px" }}>
                  Platinum (60 calls) &bull; Diamond (450 calls)
                </span>
                <h3 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)", marginBottom: "12px" }}>
                  3. Conversational AI Calling Agent (Hindi &amp; English)
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "16px" }}>
                  The pinnacle of personal accountability. An intelligent voice agent rings your personal phone at your preferred scheduled hour:
                </p>
                <ul style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.6, paddingLeft: "18px", margin: 0 }}>
                  <li><strong>Natural Fluent Dialogue:</strong> Converse comfortably in English or Hindi.</li>
                  <li><strong>Activity Audits:</strong> Inquires specifically about tasks scheduled for today.</li>
                  <li><strong>Next-Step Instructions:</strong> Briefs you on your next focus session and helps clear mental roadblocks.</li>
                  <li><strong>Configurable Schedule:</strong> Choose your exact preferred calling hours to suit your lifestyle.</li>
                </ul>
              </div>

              <div
                style={{
                  padding: "28px",
                  borderRadius: "12px",
                  backgroundColor: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  textAlign: "center",
                }}
              >
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(255, 214, 0, 0.15)", border: "2px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 16px" }}>
                  📞
                </div>
                <div style={{ fontWeight: 800, color: "var(--text)", fontSize: "1.1rem", marginBottom: "4px" }}>
                  Incoming Accountability Call
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--accent-primary)", marginBottom: "16px" }}>
                  AuraMind Voice Agent &bull; 18:30 IST
                </div>
                <div style={{ padding: "12px 16px", borderRadius: "8px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "left", lineHeight: 1.5 }}>
                  <em>&ldquo;Namaste Ridham! AuraMind calling. You scheduled 90 minutes for Full-Stack Module 4 today. Did you manage to complete the API endpoints?&rdquo;</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. QUANTIFIED PROGRESS & REPORTS */}
      <section style={{ padding: "72px 0", backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-default)" }}>
        <div className="container" style={{ maxWidth: "940px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>
              Quantified Metrics
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "8px" }}>
              Progress You Can See, Measure, and Celebrate
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>📈</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Daily Productivity Recap</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Every evening, view your completed focus sprints, uninterrupted minutes, and net XP accrued.
              </p>
            </div>

            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>📊</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Weekly Retrospectives</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                Audit planned vs. executed deliberate practice hours, identify distraction patterns, and adjust next week&rsquo;s pacing.
              </p>
            </div>

            <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "10px" }}>💎</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>Monthly Strategic Audits</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, margin: 0 }}>
                For Diamond members, receive full multi-goal progress statistics, completion percentages, and long-term behavioral insights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section style={{ padding: "72px 0", textAlign: "center" }}>
        <div className="container" style={{ maxWidth: "700px" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "16px" }}>
            Experience Next-Level Accountability Today
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "32px" }}>
            Choose the level of accountability that fits your ambitions. From essential hourly app reminders to daily conversational phone calls.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/beta" className="btn btn-primary btn-lg">
              🚀 JOIN THE ₹99 BETA
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">
              View Subscription Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
