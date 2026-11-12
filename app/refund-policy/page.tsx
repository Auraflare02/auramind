import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "AuraMind Cancellation & Refund Policy",
  description:
    "Read AuraMind's transparent policy on subscription billing, UPI payment verification, 6-hour activation SLAs, cancellation procedures, and refund eligibility.",
  path: "/refund-policy",
  keywords: [
    "AuraMind refund policy",
    "AuraMind cancellation",
    "subscription refund",
    "UPI payment verification SLA",
    "billing support",
  ],
});

export default function RefundPolicyPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Refund Policy", path: "/refund-policy" },
  ]);

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh" }}>
      <JsonLd data={breadcrumbs} />

      {/* HERO SECTION */}
      <section
        style={{
          paddingTop: "72px",
          paddingBottom: "48px",
          borderBottom: "1px solid var(--border-default)",
          background: "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 0, 0.08) 0%, rgba(8, 8, 8, 0) 70%)",
        }}
      >
        <div className="container" style={{ maxWidth: "860px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.78rem", padding: "3px 12px" }}>
              Billing &amp; Consumer Protection
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 3.8vw, 3rem)", marginBottom: "16px" }}>
            Cancellation &amp; Refund Policy
          </h1>

          <p className="lead" style={{ maxWidth: "680px", margin: "0 auto", color: "var(--text-secondary)" }}>
            Clear, fair, and transparent guidelines governing subscription billing, UPI verification, plan cancellations, and refund eligibility on AuraMind.
          </p>

          <div style={{ marginTop: "16px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Last Updated: November 6, 2026 &bull; Effective Date: November 6, 2026
          </div>
        </div>
      </section>

      {/* CONTENT BODY */}
      <div className="container" style={{ maxWidth: "840px", paddingTop: "56px", paddingBottom: "96px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "36px", lineHeight: "1.7", color: "var(--text-secondary)", fontSize: "0.975rem" }}>
          
          {/* SECTION 1: SUBSCRIPTION BILLING */}
          <section>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              1. Subscription Billing Overview
            </h2>
            <p>
              AuraMind provides tiered digital productivity subscriptions:
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}>
              <li><strong>20-Day Beta Programme:</strong> ₹99 one-time payment for 20 days of full beta access. Limited to 100 users with zero auto-renewals.</li>
              <li><strong>Gold Plan:</strong> ₹249 per month (or discounted annual commitment).</li>
              <li><strong>Platinum Plan:</strong> ₹699 per month (or discounted annual commitment).</li>
              <li><strong>Diamond Plan:</strong> ₹1,299 per month (or discounted annual commitment).</li>
            </ul>
            <p>
              Subscriptions provide access to digital cloud services, including AI 30-day timetable generation, daily check-in dispatching, WhatsApp accountability integrations, conversational AI calling allowances, and focus session tracking. All fees are quoted and settled in Indian Rupees (INR).
            </p>
          </section>

          {/* SECTION 2: PAYMENT VERIFICATION & 6-HOUR SLA */}
          <section>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              2. UPI Payment Verification &amp; 6-Hour SLA
            </h2>
            <p>
              Direct UPI QR payments (via Google Pay, PhonePe, Paytm, BHIM, or any bank UPI app) require manual or semi-automated bank reconciliation against your submitted 12-digit UPI Transaction ID / UTR reference number.
            </p>
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderLeft: "3px solid var(--accent-primary)",
                padding: "16px 20px",
                borderRadius: "0 10px 10px 0",
                margin: "14px 0",
              }}
            >
              <strong style={{ color: "#FFFFFF" }}>Our 6-Hour Activation Guarantee:</strong>
              <div style={{ marginTop: "4px" }}>
                Once your payment proof is submitted with a valid UTR, our verification desk reconciles incoming bank credits and activates your tier features within <strong>6 hours</strong>. If your payment is received but activation exceeds 6 hours, you may request an immediate refund or receive a 7-day complimentary extension on your subscription.
              </div>
            </div>
          </section>

          {/* SECTION 3: CANCELLATION RULES */}
          <section>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              3. Subscription Cancellation
            </h2>
            <p>
              You may cancel your subscription at any time without fees or penalties:
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}>
              <li>
                <strong>Self-Service Cancellation:</strong> Navigate to <em>Settings &rarr; Subscription Management &rarr; Cancel Subscription</em> in your dashboard.
              </li>
              <li>
                <strong>Support-Assisted Cancellation:</strong> Email <strong>ridhx02@gmail.com</strong> with your registered email and username.
              </li>
              <li>
                <strong>Access Period:</strong> Upon cancellation, your premium privileges (expanded goal quotas, WhatsApp check-ins, AI voice calling) remain fully functional until the end of your current paid billing period. After expiry, your account gracefully reverts to the free/Gold baseline without data loss.
              </li>
            </ul>
          </section>

          {/* SECTION 4: REFUND ELIGIBILITY */}
          <section>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              4. Refund Eligibility &amp; Exceptions
            </h2>
            <p>We believe in treating users with fairness. You are eligible for a 100% refund in the following circumstances:</p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}>
              <li>
                <strong>Duplicate / Erroneous Transactions:</strong> If your UPI account was debited multiple times for a single subscription, redundant debits will be refunded in full upon verification.
              </li>
              <li>
                <strong>Failed Activation SLA:</strong> If your payment was successfully received into our bank account, but our system failed to activate your subscription within 24 hours of UTR submission.
              </li>
              <li>
                <strong>3-Day Initial Satisfaction Guarantee:</strong> If you are a first-time subscriber and find that AuraMind&rsquo;s features do not suit your productivity workflow, you may request a full refund within <strong>72 hours (3 days)</strong> of your initial upgrade, provided you have not consumed more than 2 AI voice calls.
              </li>
            </ul>
            <p style={{ marginTop: "14px" }}>
              <strong>Non-Refundable Circumstances:</strong>
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px", margin: "8px 0" }}>
              <li>Subscription periods that have already elapsed beyond the 72-hour trial window.</li>
              <li>Accounts terminated due to willful breaches of our Terms &amp; Conditions (e.g., spamming World Chat, sharing abusive content, harassment).</li>
              <li>Subscriptions where allocated monthly AI calls or WhatsApp quotas have been substantially consumed.</li>
            </ul>
          </section>

          {/* SECTION 5: HOW TO REQUEST A REFUND */}
          <section>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              5. How to Request a Refund
            </h2>
            <p>To request a refund, follow these simple steps:</p>
            <ol style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px", margin: "12px 0" }}>
              <li>Send an email to <strong>ridhx02@gmail.com</strong> with the subject line <code>Refund Request - [Your 12-Digit UTR]</code>.</li>
              <li>Include your registered email address, username, chosen plan tier, and a brief description of the issue.</li>
              <li>Our finance desk acknowledges refund requests within <strong>24 hours</strong>. Approved refunds are credited directly back to the original source bank/VPA within <strong>3 to 5 business days</strong> according to standard banking processing timelines.</li>
            </ol>
          </section>

          {/* SECTION 6: BILLING DISPUTES & CONTACT */}
          <section>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              6. Billing Inquiries &amp; Support Contact
            </h2>
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "12px",
                padding: "20px 24px",
                marginTop: "12px",
              }}
            >
              <div style={{ fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>
                AuraMind Billing &amp; Consumer Support
              </div>
              <div style={{ fontSize: "0.9rem" }}>Application: <strong>AuraMind</strong> (https://theauramind.dpdns.org)</div>
              <div style={{ fontSize: "0.9rem", marginTop: "4px" }}>Support &amp; Refunds Email: <strong>ridhx02@gmail.com</strong></div>
              <div style={{ fontSize: "0.9rem", marginTop: "4px" }}>Response Time: <strong>Within 24 hours</strong></div>
            </div>
          </section>

          {/* BACK LINKS */}
          <div style={{ marginTop: "32px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <Link href="/pricing" className="btn btn-secondary btn-sm">
              &larr; View Plans &amp; Pricing
            </Link>
            <Link href="/terms" className="btn btn-secondary btn-sm">
              Read Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
