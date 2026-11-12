import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "AuraMind FAQ – Questions on AI Goal Planning, WhatsApp & Pricing",
  description:
    "Find answers to frequently asked questions about AuraMind: 30-day adaptive timetables, hourly WhatsApp check-ins, AI voice calling, subscription plans, and UPI payments.",
  path: "/faq",
  keywords: [
    "AuraMind FAQ",
    "AuraMind questions",
    "AI accountability FAQ",
    "WhatsApp check-in questions",
    "AI calling agent questions",
    "AuraMind pricing help",
    "AuraMind refund policy",
  ],
});

export default function FaqPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "FAQ", path: "/faq" },
  ]);

  const faqItems = [
    {
      category: "General & Methodology",
      q: "What makes AuraMind different from traditional to-do list apps?",
      a: "Traditional to-do apps are passive lists that sit quietly until you forget them. AuraMind is an active accountability system. It translates your ambitious goal into a structured 30-day timetable with daily focus blocks, checks in with you proactively every hour, tracks your daily focus minutes, and dynamically recalibrates future days if life causes a disruption.",
    },
    {
      category: "General & Methodology",
      q: "How does the 30-day timetable generation work?",
      a: "When you submit a goal, our Gemini AI synthesis engine analyzes your starting baseline, target outcome, and daily hour budget. It decomposes your goal into four weekly pedagogical phases (Foundations, Core Mechanics, Synthesis, and Polish) with concrete daily milestones and estimated focus times.",
    },
    {
      category: "Accountability & Check-ins",
      q: "How do hourly check-ins work?",
      a: "Every hour during your active focus window, AuraMind prompts you with a quick check-in: 'Did you complete your scheduled task?'. On the Gold plan, these arrive as in-app browser/system notifications. On Platinum and Diamond, check-ins are also delivered directly to your personal WhatsApp inbox.",
    },
    {
      category: "Accountability & Check-ins",
      q: "How does the AI Calling Agent work, and is Hindi supported?",
      a: "The AI Calling Agent (available on Platinum and Diamond plans) places an actual voice call to your phone number at your preferred scheduled hours. The agent converses naturally in Hindi or English, inquires about your completed milestones, logs your roadblocks, and provides motivating verbal instructions for your next activity. Platinum includes up to 60 calls/month; Diamond includes up to 450 calls/month.",
    },
    {
      category: "Subscription Plans & Pricing",
      q: "What are the exact prices and quotas for each plan?",
      a: "Gold is ₹249/month (1 active goal, 5 friends, in-app notifications, focus timer, reports). Platinum is ₹699/month (3 active goals, 15 friends, hourly WhatsApp check-ins, up to 60 AI calls/month, Google Calendar integration). Diamond is ₹1,299/month (25 active goals, 50 friends, WhatsApp check-ins, up to 450 AI calls/month, full Google Calendar sync).",
    },
    {
      category: "Subscription Plans & Pricing",
      q: "Can I upgrade, downgrade, or cancel at any time?",
      a: "Yes. You have full autonomous control. You can change your plan or cancel at any time from your account settings. Upgrades apply immediately upon payment verification.",
    },
    {
      category: "Payments & Verification",
      q: "How do I pay for my subscription?",
      a: "We support seamless UPI payments (Google Pay, PhonePe, Paytm, BHIM, and banking UPI apps). On the checkout page (/checkout), scan the official UPI QR code with your UPI app, complete the exact transfer, and enter your 12-digit UPI Transaction ID / UTR reference number. Our administrative reconciliation team verifies the bank credit and activates your plan within 6 hours.",
    },
    {
      category: "Payments & Verification",
      q: "Why is there a manual verification window of up to 6 hours?",
      a: "Direct UPI QR reconciliation requires matching the 12-digit UTR with bank settlement statements to prevent fraudulent screenshots and payment tampering. Our team processes incoming credits continuously, and plans are typically activated much sooner than the 6-hour SLA.",
    },
    {
      category: "Privacy & Data Protection",
      q: "Does AuraMind sell my personal data or train AI on my notes?",
      a: "Never. AuraMind operates under strict zero-advertising, zero-data-brokering policies. External API tokens (including Google Calendar OAuth tokens) are encrypted with AES-256-GCM. We never use your personal goal entries, calendar data, or check-in notes to train generalized artificial intelligence models.",
    },
    {
      category: "Privacy & Data Protection",
      q: "What is your refund policy?",
      a: "If your payment was received but your plan was not activated within our promised 6-hour SLA, or if you were billed in error, you are eligible for an immediate full refund upon submitting your UTR reference to ridhx02@gmail.com. Please review our complete Refund Policy (/refund-policy) for detailed terms.",
    },
  ];

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh" }}>
      <JsonLd data={breadcrumbs} />

      {/* HERO SECTION */}
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
              Help &amp; Answers
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 4.2vw, 3.2rem)", marginBottom: "20px" }}>
            Frequently Asked Questions
          </h1>

          <p className="lead" style={{ maxWidth: "700px", margin: "0 auto 36px", color: "var(--text-secondary)" }}>
            Everything you need to know about AuraMind&rsquo;s 30-day adaptive timetables, WhatsApp accountability, AI voice calling, pricing, and payment verification.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/pricing" className="btn btn-primary btn-lg">
              View Subscription Plans
            </Link>
            <Link href="/checkout" className="btn btn-secondary btn-lg">
              Go to Checkout
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ CONTENT LIST */}
      <section style={{ padding: "72px 0 96px" }}>
        <div className="container" style={{ maxWidth: "840px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  padding: "24px 28px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "14px",
                  transition: "border-color var(--transition-fast)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--accent-primary)",
                      backgroundColor: "rgba(255, 214, 0, 0.1)",
                      padding: "2px 8px",
                      borderRadius: "9999px",
                      border: "1px solid rgba(255, 214, 0, 0.2)",
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <h2 style={{ fontSize: "1.18rem", fontWeight: 700, margin: "0 0 10px", color: "#FFFFFF" }}>
                  {item.q}
                </h2>
                <p style={{ margin: 0, fontSize: "0.925rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>

          {/* CONTACT ASSISTANCE CALLOUT */}
          <div
            className="card"
            style={{
              marginTop: "48px",
              padding: "32px",
              textAlign: "center",
              backgroundColor: "#111111",
              border: "1px solid rgba(255, 214, 0, 0.3)",
              borderRadius: "16px",
            }}
          >
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>
              Still have questions?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0 auto 20px", maxWidth: "520px" }}>
              Our support team is always here to assist with billing inquiries, timetable questions, or AI calling configuration.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/contact" className="btn btn-primary">
                Contact Support
              </Link>
              <Link href="/refund-policy" className="btn btn-secondary">
                Read Refund Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
