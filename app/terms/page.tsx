import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — AuraMind",
  description: "Terms and conditions governing the use of the AuraMind AI goal execution and accountability platform.",
};

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", padding: "48px 0 80px" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* HEADER BREADCRUMB */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            Home
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Terms &amp; Conditions</span>
        </div>

        {/* HERO TITLE */}
        <div
          style={{
            borderBottom: "1px solid var(--border-default)",
            paddingBottom: "28px",
            marginBottom: "36px",
          }}
        >
          <span
            className="badge badge-yellow"
            style={{ marginBottom: "14px", display: "inline-block", fontSize: "0.75rem", fontWeight: 700 }}
          >
            TERMS VERSION 2026-10-V1 • EFFECTIVE OCTOBER 2026
          </span>
          <h1
            style={{
              fontSize: "clamp(2rem, 4vw, 2.75rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              marginBottom: "16px",
              lineHeight: 1.15,
            }}
          >
            Terms &amp; Conditions
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.65",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            These Terms &amp; Conditions constitute a legally binding agreement between you and AuraMind (Aura Builds). They govern your access to and use of the AuraMind goal planning, focus tracking, and accountability platform.
          </p>
        </div>

        {/* TABLE OF CONTENTS */}
        <div
          className="card"
          style={{
            padding: "24px 28px",
            marginBottom: "44px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--accent-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "14px",
            }}
          >
            Summary of Key Terms
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "8px 20px",
              fontSize: "0.875rem",
            }}
          >
            <a href="#intro" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>1. Introduction &amp; Operator</a>
            <a href="#acceptance" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>2. Acceptance of Terms</a>
            <a href="#eligibility" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>3. User Eligibility</a>
            <a href="#registration" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>4. Account Registration</a>
            <a href="#description" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>5. Description of AuraMind</a>
            <a href="#ai-limits" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>6. AI Output Limitations</a>
            <a href="#responsibilities" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>7. User Responsibilities</a>
            <a href="#acceptable-use" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>8. Acceptable Use Policy</a>
            <a href="#user-content" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>9. Ownership of User Content</a>
            <a href="#ai-content" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>10. AI-Generated Materials</a>
            <a href="#fees" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>11. Fees and Pricing</a>
            <a href="#availability" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>12. Service Availability</a>
            <a href="#intellectual-prop" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>13. Intellectual Property</a>
            <a href="#termination" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>14. Account Closure &amp; Termination</a>
            <a href="#disclaimers" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>15. Comprehensive Disclaimers</a>
            <a href="#liability" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>16. Limitation of Liability</a>
            <a href="#privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>17. Privacy &amp; Data Protection</a>
            <a href="#changes" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>18. Changes to Terms</a>
            <a href="#governing-law" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>19. Governing Law &amp; Jurisdiction</a>
            <a href="#contact" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>20. Contact Information</a>
          </div>
        </div>

        {/* MAIN BODY SECTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "38px", lineHeight: "1.7", color: "var(--text-secondary)", fontSize: "0.975rem" }}>

          {/* 1 */}
          <section id="intro">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              1. Introduction &amp; Operator Identification
            </h2>
            <p>
              Welcome to AuraMind, a web platform created to facilitate deliberate practice, execution planning, and productivity accountability. AuraMind is operated by <strong>Aura Builds</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
            </p>
            <div style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-default)", padding: "14px 18px", borderRadius: "8px", fontSize: "0.875rem" }}>
              <div>Operating Entity: <strong>Aura Builds (AuraMind)</strong></div>
              <div>Entity Status: <strong>[OPERATOR_LEGAL_ENTITY_NAME — Configuration Placeholder]</strong></div>
              <div>Registered Office: <strong>[OPERATOR_REGISTERED_ADDRESS — Configuration Placeholder]</strong></div>
              <div>Official Inquiries: <strong>[OPERATOR_SUPPORT_EMAIL — placeholder: legal@auramind.ai]</strong></div>
            </div>
          </section>

          {/* 2 */}
          <section id="acceptance">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              2. Acceptance of Terms
            </h2>
            <p>
              By creating an account, selecting the affirmative checkbox during registration, or accessing the services, you confirm that you have read, understood, and agreed to be bound by these Terms &amp; Conditions.
            </p>
            <p>
              <strong>Affirmative Acceptance Required:</strong> Acceptance is never implied merely by visiting the website. The registration checkbox must be explicitly checked by you and starts unchecked by default. If you do not agree to these Terms, you must not create an account or use the services.
            </p>
          </section>

          {/* 3 */}
          <section id="eligibility">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              3. User Eligibility
            </h2>
            <p>
              You must be at least 18 years of age (or the age of legal majority in your jurisdiction) to independently enter into these Terms. If you are between 13 and 17 years old, you may only use AuraMind with the express permission and supervision of a parent or legal guardian who agrees to be bound by these Terms. Under no circumstances may anyone under 13 register or submit personal data to AuraMind.
            </p>
          </section>

          {/* 4 */}
          <section id="registration">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              4. Account Registration &amp; Security
            </h2>
            <p>
              To access personalized goal planning and focus tracking, you must register an account. You agree to provide accurate, current, and complete information during registration.
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>You are solely responsible for safeguarding your login credentials (email and password).</li>
              <li>You must immediately notify us if you suspect any unauthorized access or security breach involving your account.</li>
              <li>You may not transfer, sell, or share your account credentials with third parties.</li>
            </ul>
          </section>

          {/* 5 */}
          <section id="description">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              5. Description of AuraMind Services
            </h2>
            <p>
              AuraMind provides digital productivity and accountability software that transforms user-submitted goals into structured 30-day timetables, tracks focused execution sessions via interactive timers, records daily check-ins, calculates deliberate practice streaks, and generates progress diagnostics using artificial intelligence.
            </p>
            <p>
              Features are provided on an evolving basis. We reserve the right to refine algorithms, introduce enhancements, or discontinue specific legacy tools as product development progresses.
            </p>
          </section>

          {/* 6 */}
          <section id="ai-limits">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              6. Artificial Intelligence Limitations &amp; Disclaimers
            </h2>
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderLeft: "3px solid var(--accent-primary)",
                padding: "16px 20px",
                borderRadius: "0 8px 8px 0",
                fontSize: "0.9rem",
              }}
            >
              <p style={{ margin: "0 0 10px", color: "var(--text-primary)", fontWeight: 600 }}>
                CRITICAL NOTICE CONCERNING AI-GENERATED RECOMMENDATIONS:
              </p>
              <p style={{ margin: 0 }}>
                Plans, milestones, resource estimates, and time allocations generated by AuraMind are powered by statistical large language models (Google Gemini API). While designed using cognitive science principles, AI outputs may contain errors, incomplete information, unfeasible pacing, or inaccurate curriculum milestones. You are expected to evaluate all recommendations critically against your personal health, safety, and real-world capacity.
              </p>
            </div>
            <p style={{ marginTop: "14px" }}>
              <strong>No Guarantee of Success:</strong> AuraMind provides tools to support your consistency, but we make no guarantee that following any schedule will result in exam success, language fluency, career advancement, physical fitness, or financial achievement.
            </p>
          </section>

          {/* 7 */}
          <section id="responsibilities">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              7. User Responsibilities &amp; Health Notice
            </h2>
            <p>
              AuraMind is an accountability tool, not a substitute for personal judgment. You agree:
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Not to neglect fundamental physical needs, including adequate sleep, nutrition, medical care, and hydration, in pursuit of goal streaks.</li>
              <li>Not to sacrifice mandatory academic, familial, employment, or legal responsibilities.</li>
              <li>To adjust or pause any schedule immediately if you experience physical strain, extreme burnout, or mental distress.</li>
            </ul>
          </section>

          {/* 8 */}
          <section id="acceptable-use">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              8. Acceptable Use Policy
            </h2>
            <p>When using AuraMind, you agree not to:</p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <li>Use the platform for any illegal, fraudulent, defamatory, or harmful purpose.</li>
              <li>Attempt to probe, scan, or compromise server security, or bypass Row-Level Security policies.</li>
              <li>Reverse engineer, decompile, or disassemble any portion of the software or AI prompt architectures.</li>
              <li>Deploy automated spiders, scrapers, or bots that impose an unreasonable load on server infrastructure.</li>
              <li>Submit goals or content depicting violent extremism, self-harm, harassment, or unlawful conduct.</li>
            </ul>
          </section>

          {/* 9 */}
          <section id="user-content">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              9. Ownership of User Content
            </h2>
            <p>
              You retain all intellectual property rights and full ownership of the personal goals, reflections, notes, and progress records you submit to AuraMind.
            </p>
            <p>
              You grant AuraMind a non-exclusive, worldwide, royalty-free license solely to process, transmit, and store your content for the strict purpose of providing, maintaining, and displaying your personal plans and focus metrics.
            </p>
          </section>

          {/* 10 */}
          <section id="ai-content">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              10. AI-Generated Materials &amp; Advice Disclaimer
            </h2>
            <p>
              AI-generated blueprints, daily tasks, and feedback reports are provided solely for personal productivity and educational guidance. AuraMind does not provide medical, psychiatric, legal, financial, or architectural advice. If your goal touches upon medical treatment, mental health recovery, or professional certifications, you must consult qualified licensed professionals.
            </p>
          </section>

          {/* 11 */}
          <section id="fees">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              11. Fees, Subscriptions, and Payments
            </h2>
            <p>
              AuraMind currently offers its core personalized planning and accountability features free of charge. If premium tiers or specialized AI features are introduced in the future, all pricing, billing cycles, cancellation terms, and refund guidelines will be clearly presented for affirmative review before any payment is collected.
            </p>
          </section>

          {/* 12 */}
          <section id="availability">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              12. Service Availability &amp; Modifications
            </h2>
            <p>
              While we strive for maximum uptime and responsiveness, AuraMind is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We do not guarantee uninterrupted, bug-free, or error-free operation. We reserve the right to perform scheduled maintenance, update API endpoints, or modify features without prior liability.
            </p>
          </section>

          {/* 13 */}
          <section id="intellectual-prop">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              13. Intellectual Property Rights
            </h2>
            <p>
              All trademarks, software source code, design systems, visual styling, UX flows, animations, documentation, and original branding associated with AuraMind and Aura Builds are the exclusive intellectual property of the operator or its licensors. You may not copy, reproduce, or distribute any part of AuraMind without prior written permission.
            </p>
          </section>

          {/* 14 */}
          <section id="termination">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              14. Account Closure &amp; Termination
            </h2>
            <p>
              You may close your account at any time through your Account Settings or by emailing our support desk. Upon termination, your right to use the platform ceases immediately.
            </p>
            <p>
              We reserve the right to suspend or terminate accounts that breach these Terms, engage in security attacks, or abuse platform resources.
            </p>
          </section>

          {/* 15 */}
          <section id="disclaimers">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              15. Disclaimers of Warranties
            </h2>
            <p style={{ textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.02em" }}>
              TO THE MAXIMUM EXTENT PERMITTED UNDER APPLICABLE LAW, AURAMIND AND AURA BUILDS EXPRESSLY DISCLAIM ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
          </section>

          {/* 16 */}
          <section id="liability">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              16. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall AuraMind, Aura Builds, or its developers be liable for any indirect, incidental, special, consequential, or punitive damages (including loss of profits, data, goodwill, or personal time) arising out of or related to your use of or inability to use the platform, even if advised of the possibility of such damages.
            </p>
          </section>

          {/* 17 */}
          <section id="privacy">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              17. Privacy &amp; Data Protection
            </h2>
            <p>
              Your personal information is collected, processed, and safeguarded in accordance with our{" "}
              <Link
                href="/privacy-policy"
                style={{
                  color: "var(--accent-primary)",
                  fontWeight: 700,
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Privacy Policy
              </Link>
              , which is incorporated by reference into these Terms.
            </p>
          </section>

          {/* 18 */}
          <section id="changes">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              18. Changes to These Terms
            </h2>
            <p>
              We may revise these Terms to reflect legislative changes, security upgrades, or new features. When material modifications occur, we will update the version number (e.g. <code>2026-10-V1</code>) and post a notification. Continued use after the effective date of updated Terms constitutes your affirmative acceptance of the revised Terms.
            </p>
          </section>

          {/* 19 */}
          <section id="governing-law">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              19. Governing Law and Dispute Resolution
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the substantive laws of <strong>[GOVERNING_JURISDICTION_CITY_COUNTRY — Configuration Placeholder]</strong>, without regard to conflict of law principles. Any legal suit, action, or proceeding arising out of or related to these Terms shall be instituted exclusively in the competent courts located within <strong>[COMPETENT_COURT_LOCATION — Configuration Placeholder]</strong>.
            </p>
          </section>

          {/* 20 */}
          <section id="contact">
            <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              20. Contact Information
            </h2>
            <p>
              For legal inquiries, terms clarification, or formal notifications, please contact:
            </p>
            <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: "10px", padding: "18px 22px", fontSize: "0.9rem" }}>
              <div>AuraMind Legal Department (Aura Builds)</div>
              <div>Email: <strong>[OPERATOR_LEGAL_EMAIL — placeholder: legal@auramind.ai]</strong></div>
              <div>Address: <strong>[OPERATOR_LEGAL_ADDRESS — Configuration Placeholder]</strong></div>
              <div>Phone: <strong>[OPERATOR_PHONE_NUMBER — Optional Configuration Placeholder]</strong></div>
            </div>
          </section>

        </div>

        {/* BOTTOM NAVIGATION */}
        <div style={{ marginTop: "60px", paddingTop: "24px", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="btn btn-secondary btn-sm" style={{ borderRadius: "8px" }}>
            ← Back to Home
          </Link>
          <Link href="/privacy-policy" className="btn btn-secondary btn-sm" style={{ borderRadius: "8px" }}>
            Read Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
