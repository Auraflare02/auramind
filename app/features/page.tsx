import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "AuraMind Features – AI Goal Planning, Productivity & Accountability",
  description:
    "Explore AuraMind's complete feature suite: AI Goal Planner, 30-day personalized timetables, hourly check-ins, WhatsApp accountability, AI calling agent, focus timer, XP levels, and community chat.",
  path: "/features",
  keywords: [
    "AuraMind features",
    "AI goal planner",
    "30-day timetable generator",
    "AI accountability",
    "WhatsApp productivity check-ins",
    "AI phone call assistant",
    "focus timer",
    "XP level system",
    "social accountability",
  ],
});

export default function FeaturesPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
  ]);

  const featureSuites = [
    {
      suiteTitle: "AI Goal Architecture & Planning",
      suiteBadge: "Cognitive Synthesis",
      suiteDesc: "Deconstruct vague intentions into daily deliberate practice schedules calibrated to your cognitive energy.",
      features: [
        {
          id: "goal-planner",
          title: "AI Goal Planner",
          badge: "Gold • Platinum • Diamond",
          tier: "Included in all plans",
          desc: "Our neural architecture analyzes your target objective, baseline skill level, target deadline, and available daily hours. It isolates core competencies, prerequisites, and milestone criteria to transform high-level ambitions into actionable execution blocks.",
          highlights: [
            "Baseline to target proficiency mapping (Beginner to Expert)",
            "Dynamic calibration based on daily available hours (1h to 8h+)",
            "Contextual cognitive focus window targeting (Morning, Afternoon, Evening, Night)",
            "Constraint handling for fixed routines and personal obligations",
          ],
        },
        {
          id: "timetable-generator",
          title: "30-Day Timetable Generator",
          badge: "Gold • Platinum • Diamond",
          tier: "Included in all plans",
          desc: "Generates an exhaustive, day-by-day 30-day deliberate practice schedule. Each day contains discrete, bite-sized tasks with specific completion criteria, expected deliverables, and realistic time estimates.",
          highlights: [
            "Chronological milestone progression across 4 structured weeks",
            "Day 1 immediate-launch operational instructions",
            "Structured rest and consolidation buffers to prevent cognitive burnout",
            "Interactive daily completion checkboxes and status updates",
          ],
        },
        {
          id: "goal-tracking",
          title: "Intelligent Goal Tracking",
          badge: "Gold (1) • Platinum (3) • Diamond (25)",
          tier: "Tier-based Goal Allowances",
          desc: "Monitor your active 30-day trajectories with granular progress meters, completed task tallies, consistency streaks, and real-time completion velocity metrics.",
          highlights: [
            "Real-time percentage progress calculations",
            "Archived history of completed milestones and daily deliverables",
            "Seamless multi-goal dashboard management for Platinum and Diamond users",
            "Adaptive milestone adjustments when schedules shift",
          ],
        },
        {
          id: "distraction-analysis",
          title: "Distraction Pattern Analysis",
          badge: "Gold (Basic) • Platinum & Diamond (Advanced)",
          tier: "Advanced AI Diagnostic",
          desc: "Identify exactly where and why your focus fractures. AuraMind tracks self-reported distraction patterns, task abandonment points, and digital friction to suggest environmental adjustments.",
          highlights: [
            "Identification of recurring friction triggers (phone, mental fatigue, multitasking)",
            "Correlation between scheduled focus hours and actual completion rates",
            "Actionable behavioral interventions to defend deep work windows",
          ],
        },
      ],
    },
    {
      suiteTitle: "Active Accountability & Multi-Channel Nudges",
      suiteBadge: "Proactive Behavioral Defense",
      suiteDesc: "Never rely solely on fleeting motivation. AuraMind engages you proactively across apps, messaging, and voice.",
      features: [
        {
          id: "hourly-checkins",
          title: "Hourly App Check-ins",
          badge: "Gold • Platinum • Diamond",
          tier: "Included in all plans",
          desc: "Gentle, non-intrusive in-app notifications and dashboard check-ins timed precisely to your scheduled focus blocks. Quick 1-click prompts confirm whether your deliberate practice block was completed.",
          highlights: [
            "Zero-friction 1-tap confirmation prompts",
            "Automatic logging to your daily productivity timeline",
            "Real-time encouragement and XP bonus rewards for timely execution",
          ],
        },
        {
          id: "whatsapp-checkins",
          title: "WhatsApp Accountability Messages",
          badge: "Platinum & Diamond Exclusive",
          tier: "WhatsApp API Integration",
          desc: "Receive conversational check-in prompts directly on WhatsApp. AuraMind asks what tasks you have accomplished, prompts for task completion updates, and alerts you to upcoming scheduled blocks without requiring you to open the browser.",
          highlights: [
            "Direct two-way messaging in your native WhatsApp conversation",
            "Morning briefing with Day overview and target deliverables",
            "Evening debrief confirming daily task completion and XP earned",
            "Real-time reminders when scheduled deep-work blocks approach",
          ],
        },
        {
          id: "ai-calling-agent",
          title: "AI Calling Agent (Hindi & English Voice)",
          badge: "Platinum (60 calls) • Diamond (450 calls)",
          tier: "Conversational Voice AI",
          desc: "A personal accountability partner in your pocket. An intelligent voice agent calls your phone at your configured preferred times. It checks on completed activities, inquires about pending tasks, and provides tailored instructions for your next focus session in fluent Hindi or English.",
          highlights: [
            "Configurable call schedules based on your personal daily rhythm",
            "Natural, human-like voice conversation in English and Hindi",
            "Reviews completed activities and unblocks stalled tasks",
            "60 calls/month on Platinum and 450 calls/month on Diamond",
          ],
        },
        {
          id: "google-calendar",
          title: "Google Calendar Synchronization",
          badge: "Platinum (Basic) • Diamond (Full 2-Way Sync)",
          tier: "Google Calendar API Integration",
          desc: "Seamlessly map your 30-day goal timetable directly into Google Calendar. Visualize your productivity blocks alongside your existing work meetings, classes, and family commitments.",
          highlights: [
            "Automated calendar event creation for daily deliberate practice blocks",
            "Conflict detection with existing calendar commitments",
            "Full bidirectional synchronization on Diamond plan",
          ],
        },
      ],
    },
    {
      suiteTitle: "Productivity Tools & Behavioral Gamification",
      suiteBadge: "Dopamine-Aligned Execution",
      suiteDesc: "Transform grueling deliberate practice into engaging, quantifiable momentum with game mechanics and actionable analytics.",
      features: [
        {
          id: "focus-timer",
          title: "Interactive Focus Timer (Pomodoro)",
          badge: "Gold • Platinum • Diamond",
          tier: "Included in all plans",
          desc: "A minimalist, distraction-free focus timer embedded directly inside your goal workspace. Run 25-minute Pomodoro sprints or custom deep-work marathons with visual progress rings.",
          highlights: [
            "Configurable sprint durations (15m, 25m, 45m, 90m)",
            "Zero digital distraction UI with full-screen focus mode",
            "Direct XP conversion for every minute of uninterrupted focus",
          ],
        },
        {
          id: "xp-levels",
          title: "XP & Level Progression System",
          badge: "Gold • Platinum • Diamond",
          tier: "Included in all plans",
          desc: "Earn Experience Points (XP) for every task completed, focus timer session logged, and hourly check-in confirmed. Level up your productivity rank from Novice Pioneer to Grandmaster Executioner.",
          highlights: [
            "Immediate visual feedback upon milestone completion",
            "Multi-tiered productivity ranks and achievement badges",
            "Dynamic XP multiplier streaks for consecutive days of consistency",
          ],
        },
        {
          id: "reports",
          title: "Daily, Weekly & Monthly Productivity Reports",
          badge: "Gold (Daily/Weekly) • Diamond (Monthly Analytics)",
          tier: "Quantified Analytics",
          desc: "Comprehensive diagnostic reports summarizing your deep work hours, consistency scores, completed milestones, and top distraction vectors. Download or review your weekly retrospectives.",
          highlights: [
            "Daily recap highlighting completed tasks and time investment",
            "Weekly velocity analysis comparing planned vs. actual execution",
            "Monthly strategic reports detailing long-term skill acquisition",
          ],
        },
      ],
    },
    {
      suiteTitle: "Friends & Social Accountability Community",
      suiteBadge: "Peer Support Network",
      suiteDesc: "Harness the power of social proof and peer accountability in a safe, focused environment guarded by AuraSentinel AI.",
      features: [
        {
          id: "add-friends",
          title: "Friend Accountability Connections",
          badge: "Gold (5) • Platinum (15) • Diamond (50)",
          tier: "Social Accountability",
          desc: "Connect with study partners, accountability buddies, and colleagues using unique AuraMind IDs (`AM-XXXXXX`) or usernames. Keep each other motivated and celebrate milestones together.",
          highlights: [
            "Privacy-first profile resolution (personal emails and phones remain private)",
            "Share selected 30-day goals with friends while keeping private goals hidden",
            "Built-in friendship controls: accept, decline, unfriend, or block",
          ],
        },
        {
          id: "private-chat",
          title: "Private Peer Messaging",
          badge: "Gold • Platinum • Diamond",
          tier: "Real-time Peer Chat",
          desc: "Engage in direct, encrypted one-on-one accountability conversations with accepted friends. Exchange progress updates, discuss problem-solving strategies, and keep each other focused on milestones.",
          highlights: [
            "Instant real-time message delivery",
            "Strict AuraSentinel AI moderation against spam, abuse, and off-topic distractions",
            "Shared goal milestone cards embedded directly in conversation",
          ],
        },
        {
          id: "world-chat",
          title: "World Community Live Chat",
          badge: "Gold • Platinum • Diamond",
          tier: "Global Pioneer Network",
          desc: "A vibrant global public square for all AuraMind pioneers. Share study victories, discuss productive habits, seek advice on challenging goals, and connect with motivated builders worldwide.",
          highlights: [
            "Real-time global room with active online presence indicators",
            "Zero social media handles or promotional spam permitted",
            "Focus-driven discussion culture strictly oriented around personal growth",
          ],
        },
      ],
    },
  ];

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh" }}>
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
              AuraMind Platform Architecture
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", marginBottom: "20px" }}>
            AuraMind Features – AI Goal Planning, Productivity &amp; Accountability
          </h1>

          <p className="lead" style={{ maxWidth: "720px", margin: "0 auto 36px", color: "var(--text-secondary)" }}>
            Explore the complete ecosystem engineered to turn ambitious intentions into daily deliberate practice. From instant 30-day AI timetables to proactive WhatsApp reminders and conversational AI phone calls.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/#create-goal" className="btn btn-primary btn-lg">
              Start Free Goal Plan &rarr;
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">
              View Subscription Plans
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FEATURE SUITES DEEP DIVE */}
      <section style={{ padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "1140px" }}>
          {featureSuites.map((suite, sIdx) => (
            <div key={sIdx} style={{ marginBottom: sIdx === featureSuites.length - 1 ? 0 : "80px" }}>
              <div style={{ marginBottom: "32px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span className="badge badge-yellow" style={{ fontSize: "0.75rem" }}>
                    {suite.suiteBadge}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>
                  {suite.suiteTitle}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "700px", margin: 0 }}>
                  {suite.suiteDesc}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "24px",
                }}
              >
                {suite.features.map((feat) => (
                  <div
                    key={feat.id}
                    id={feat.id}
                    className="surface-card"
                    style={{
                      padding: "28px",
                      borderRadius: "14px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-default)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          marginBottom: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#FFFFFF" }}>
                          {feat.title}
                        </h3>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            backgroundColor: "rgba(255, 214, 0, 0.12)",
                            color: "var(--accent-primary)",
                            border: "1px solid rgba(255, 214, 0, 0.3)",
                          }}
                        >
                          {feat.badge}
                        </span>
                      </div>

                      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "20px" }}>
                        {feat.desc}
                      </p>

                      <ul style={{ paddingLeft: "18px", margin: "0 0 20px", color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
                        {feat.highlights.map((item, iIdx) => (
                          <li key={iIdx} style={{ marginBottom: "6px" }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{feat.tier}</span>
                      <Link href="/pricing" style={{ fontSize: "0.8rem", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 700 }}>
                        Compare &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. CALL TO ACTION FOOTER */}
      <section
        style={{
          padding: "72px 0",
          borderTop: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-secondary)",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: "700px" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "16px" }}>
            Ready to Build an Unshakeable Execution System?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginBottom: "32px" }}>
            Set your target skill, generate your custom 30-day timetable, and let AuraMind&rsquo;s proactive accountability keep you consistent every single hour.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/#create-goal" className="btn btn-primary btn-lg">
              Generate Your 30-Day Plan
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">
              Explore Subscription Tiers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
