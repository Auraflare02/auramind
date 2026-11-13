import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "About AuraMind – Building a Smarter AI Productivity Platform",
  description:
    "Learn about AuraMind's mission: building an intelligent AI accountability system that adapts to human reality rather than demanding robotic perfection.",
  path: "/about",
  keywords: [
    "About AuraMind",
    "AuraMind mission",
    "AuraMind story",
    "AI productivity platform",
    "AI accountability system",
    "goal achievement system",
    "AI productivity startup",
  ],
});

export default function AboutPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]);

  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
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
              Our Story &bull; Behavioral Philosophy
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)", marginBottom: "20px" }}>
            About AuraMind – Building a Smarter AI Productivity Platform
          </h1>

          <p className="lead" style={{ maxWidth: "720px", margin: "0 auto 36px", color: "var(--text-secondary)" }}>
            We believe that human potential is vast, but modern attention is besieged. AuraMind is built to bridge the painful gap between what you intend to do and what you actually execute.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/#create-goal" className="btn btn-primary btn-lg">
              Start Your First Goal
            </Link>
            <Link href="/features" className="btn btn-secondary btn-lg">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE CORE MOTIVATION */}
      <section style={{ padding: "80px 0", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ maxWidth: "840px" }}>
          <div style={{ marginBottom: "40px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "12px" }}>
              The Problem We Saw
            </span>
            <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
              The Flaw of the &ldquo;Perfect Day&rdquo; Trap
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "20px" }}>
              Almost every productivity tool on the market makes a dangerous assumption: it assumes you are a robot operating in a vacuum. You open a calendar or to-do app, block out an immaculate 12-hour day of non-stop productivity, and feel an artificial rush of accomplishment before doing any actual work.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "20px" }}>
              Then reality happens. You get a late-night headache, an unexpected family commitment arrives, or work emergencies derail your morning. By 2:00 PM, your pristine calendar is completely broken.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, margin: 0 }}>
              At that point, most tools induce guilt. Overdue badges turn glaring red. Discouraged, you close the app, ignore your goals for three weeks, and repeat the cycle six months later.
            </p>
          </div>

          <div
            style={{
              padding: "32px",
              borderRadius: "14px",
              backgroundColor: "rgba(255, 214, 0, 0.05)",
              border: "1px solid rgba(255, 214, 0, 0.3)",
              textAlign: "center",
              marginBottom: "56px",
            }}
          >
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-primary)", fontStyle: "italic", marginBottom: "8px" }}>
              &ldquo;Don&rsquo;t plan a perfect day. Build a system that learns your real one.&rdquo;
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              The Foundational Operating Principle of AuraMind
            </div>
          </div>

          <div>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "12px" }}>
              Our Approach
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text)", marginBottom: "16px" }}>
              Proactive Behavioral Architecture
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "20px" }}>
              AuraMind was conceived around an alternative philosophy: <strong>deliberate practice combined with active accountability</strong>.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "20px" }}>
              Instead of passive lists, AuraMind uses artificial intelligence to deconstruct your ambitions into structured, 30-day operational chapters. It matches demanding focus blocks to your natural cognitive peaks. And when life disrupts a day, it does not punish you—it dynamically recalibrates your remaining timetable so your deadline remains achievable.
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, margin: 0 }}>
              Crucially, we recognize that willpower alone is unreliable. By introducing multi-channel interventions—from gentle hourly app prompts to direct WhatsApp reminders and conversational AI phone calls—we create the social and psychological cues that keep you moving forward.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CLARITY OF IDENTITY */}
      <section style={{ padding: "80px 0", backgroundColor: "var(--bg-secondary)" }}>
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "8px" }}>
              What AuraMind Is &bull; And What It Isn&rsquo;t
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "8px" }}>
              A Dedicated AI Productivity &amp; Accountability Platform
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "680px", margin: "12px auto 0" }}>
              AuraMind is engineered specifically for ambitious individuals seeking skill mastery and tangible output.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
            <div style={{ padding: "28px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div style={{ color: "var(--success)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "12px" }}>
                ✓ What AuraMind Is
              </div>
              <ul style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.8, paddingLeft: "18px", margin: 0 }}>
                <li>A deliberate practice engine that turns skills into daily milestones.</li>
                <li>A proactive accountability partner checking on your progress.</li>
                <li>A distraction diagnostic tool identifying focus bottlenecks.</li>
                <li>A gamified progression system with real XP and level milestones.</li>
                <li>A focused community of ambitious peers pushing each other.</li>
              </ul>
            </div>

            <div style={{ padding: "28px", borderRadius: "12px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)" }}>
              <div style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "12px" }}>
                ✕ What AuraMind Is Not
              </div>
              <ul style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.8, paddingLeft: "18px", margin: 0 }}>
                <li>It is not a generic meditation or spiritual mindfulness app.</li>
                <li>It is not a passive digital notepad or cluttered Kanban board.</li>
                <li>It is not a social media feed designed to steal your attention.</li>
                <li>It is not a rigid calendar that falls apart on your first bad day.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR LONG-TERM VISION */}
      <section style={{ padding: "80px 0" }}>
        <div className="container" style={{ maxWidth: "840px", textAlign: "center" }}>
          <span className="badge badge-yellow" style={{ fontSize: "0.75rem", marginBottom: "12px" }}>
            The Horizon
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "16px" }}>
            Our Long-Term Vision
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.8, marginBottom: "36px" }}>
            We are building AuraMind to become the definitive operating system for personal agency. As artificial intelligence advances, the greatest differentiator in life will not be access to information, but the capacity for sustained focus, deliberate practice, and unbroken follow-through. We want to empower millions of builders, students, and creators to realize their most audacious ambitions.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/#create-goal" className="btn btn-primary btn-lg">
              Start Your Goal Today
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg">
              View Subscription Tiers
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
