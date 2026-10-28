import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — AuraMind",
  description: "Learn how AuraMind processes, protects, and respects your personal information, AI prompts, and goal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", padding: "48px 0 80px" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        {/* HEADER BREADCRUMB */}
        <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}>
          <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            Home
          </Link>
          <span style={{ color: "var(--border-default)" }}>/</span>
          <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>Privacy Policy</span>
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
            POLICY VERSION 2026-10-V1 • EFFECTIVE OCTOBER 2026
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
            Privacy Policy
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.65",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
            At AuraMind, we believe users should understand how their personal information is handled. This Privacy Policy explains what information AuraMind processes, why it is processed, how it is protected, and what choices are available to users.
          </p>
        </div>

        {/* QUICK NAVIGATION TABLE OF CONTENTS */}
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
            Table of Contents
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "8px 20px",
              fontSize: "0.875rem",
            }}
          >
            <a href="#about" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>1. About AuraMind</a>
            <a href="#info-processed" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>2. Information We Process</a>
            <a href="#why-process" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>3. Why We Process Information</a>
            <a href="#cookies" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>4. Cookies &amp; Tracking</a>
            <a href="#ai-processing" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>5. AI Processing (Google Gemini)</a>
            <a href="#google-calendar" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>6. Google Calendar Integration</a>
            <a href="#hosting" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>7. Hosting &amp; Infrastructure</a>
            <a href="#sharing" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>8. Sharing of Information</a>
            <a href="#retention" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>9. Data Retention</a>
            <a href="#security" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>10. Data Security</a>
            <a href="#privacy-rights" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>11. User Privacy Rights (DPDP Act)</a>
            <a href="#account-deletion" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>12. Account Deletion Workflow</a>
            <a href="#minors" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>13. Minors &amp; Children&rsquo;s Privacy</a>
            <a href="#international" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>14. International Data Processing</a>
            <a href="#changes" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>15. Changes to This Policy</a>
            <a href="#contact" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>16. Contact &amp; Grievance Redressal</a>
          </div>
        </div>

        {/* POLICY CONTENT SECTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px", lineHeight: "1.7", color: "var(--text-secondary)", fontSize: "0.975rem" }}>
          
          {/* SECTION 1 */}
          <section id="about">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              1. About AuraMind
            </h2>
            <p>
              AuraMind is an intelligent goal achievement and accountability platform operating under <strong>Aura Builds</strong>. The platform empowers individuals to transform abstract ambitions into structured 30-day deliberate practice schedules, monitor focused execution windows, log distraction patterns, and adapt routines dynamically.
            </p>
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                padding: "16px 20px",
                marginTop: "12px",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
                Platform Operator Information
              </div>
              <div>Entity / Brand: <strong>Aura Builds (AuraMind)</strong></div>
              <div>Operating Jurisdiction: <strong>[OPERATOR_LEGAL_ENTITY_NAME — Configuration Placeholder]</strong></div>
              <div>Registered Address: <strong>[OPERATOR_REGISTERED_ADDRESS — Configuration Placeholder]</strong></div>
              <div>Primary Contact: <strong>[OPERATOR_CONTACT_EMAIL — placeholder: contact@auramind.ai]</strong></div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="info-processed">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              2. Information We Process
            </h2>
            <p>
              AuraMind processes only the personal and technical information strictly required to operate the application, maintain user security, and synthesize individualized goal execution schedules:
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Account &amp; Identity Credentials:</strong> Full name, email address, password hash (encrypted securely via Supabase Auth bcrypt), unique user ID, and OAuth profile metadata (avatar URL) if authenticated via Google.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Goal Context &amp; Planning Data:</strong> Goal title, category, starting baseline, target proficiency level, available daily hours, preferred focus window (morning, afternoon, evening, night), known distractions, historical roadblocks, schedule commitments, and target deadlines.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Execution &amp; Accountability Records:</strong> Generated 30-day schedules, daily task blocks, check-in completion records, focus timer durations, tracked distractions, XP milestones, and streak counters.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Consent &amp; Audit Records:</strong> Timestamp of policy acceptance, version of terms and privacy policy accepted, and record of optional communication preferences.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Technical Logs:</strong> Server request timestamps, client IP address, and User-Agent headers processed transiently for security monitoring, DDoS mitigation, and audit integrity.
              </li>
            </ul>
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                borderLeft: "3px solid var(--accent-primary)",
                padding: "12px 16px",
                borderRadius: "0 8px 8px 0",
                marginTop: "14px",
                fontSize: "0.875rem",
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>What We Do NOT Collect:</strong> AuraMind does <em>not</em> collect voice recordings, audio transcripts, biometric data, precise GPS geolocation, government identity numbers, contacts, or credit card payment information.
            </div>
          </section>

          {/* SECTION 3 */}
          <section id="why-process">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              3. Why We Process Information
            </h2>
            <p>Information is processed solely for legitimate, declared operational purposes:</p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Essential Service Provision:</strong> Creating and securing your account, maintaining authenticated sessions, generating goal timetables, and persisting daily progress.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>AI Intelligence &amp; Personalization:</strong> Translating your submitted goal, constraints, and starting level into a tailored pedagogical blueprint and schedule.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Platform Integrity &amp; Security:</strong> Preventing automated abuse, rate-limiting malicious endpoints, and maintaining service stability.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Optional Communications:</strong> Sending deliberate practice insights, product updates, or weekly accountability summaries <em>only if you explicitly opt in</em> via an unchecked checkbox.</li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section id="cookies">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              4. Cookies and Tracking Technologies
            </h2>
            <p>
              AuraMind does <strong>not</strong> intentionally use advertising cookies, marketing tracking pixels, cross-site trackers, or third-party behavioral analytics services.
            </p>
            <p>
              To maintain necessary technical functionality, the platform utilizes:
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Strictly Necessary Authentication Cookies:</strong> HTTP-only session cookies managed by Supabase Auth (e.g. <code>sb-*-auth-token</code>) required to keep you signed in securely as you navigate between pages.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Local Storage:</strong> A simple browser key (<code>auramind_theme</code>) storing your visual preference (<code>dark</code> or <code>light</code>) locally on your device without transmitting it to external servers.
              </li>
            </ul>
            <p>Because we do not deploy advertising or non-essential tracking cookies, no intrusive cookie banners or consent popups are required.</p>
          </section>

          {/* SECTION 5 */}
          <section id="ai-processing">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              5. AI Processing (Google Gemini API)
            </h2>
            <p>
              AuraMind uses the official <strong>Google Gemini API</strong> (via the <code>@google/genai</code> SDK, utilizing models such as <code>gemini-3.5-flash</code> and <code>gemini-3.1-flash-lite</code>) to synthesize goal blueprints and 30-day execution schedules.
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Information Shared with the AI Engine:</strong> When you submit a goal, AuraMind transmits your goal title, category, starting level, target level, focus window, declared distractions, and scheduling constraints to Google Gemini.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>No Model Training on Private Data:</strong> Calls to the Google Gemini API are performed under enterprise API terms, which explicitly provide that user inputs and generated responses submitted via paid/standard API endpoints are <strong>not</strong> used to train Google foundation models.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>No Autonomous Actions:</strong> AI outputs are limited to structured text recommendations and schedule blocks. The AI cannot execute external actions, incur costs, or alter user accounts autonomously.
              </li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section id="google-calendar">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              6. Google Calendar Integration &amp; Limited Use Disclosure
            </h2>
            <p>
              AuraMind offers an optional, voluntary integration with <strong>Google Calendar</strong> that allows users to synchronize their AI-synthesized 30-day curriculum, daily focus sessions, and timetable changes directly into their primary Google Calendar.
            </p>
            <div
              style={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                padding: "18px 20px",
                marginBottom: "16px",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--accent-primary)", marginBottom: "8px" }}>
                Compliance with Google API Services User Data Policy
              </div>
              <p style={{ margin: "0 0 10px", lineHeight: 1.55 }}>
                AuraMind&rsquo;s use and transfer to any other app of information received from Google APIs will strictly adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--accent-primary)", textDecoration: "underline" }}
                >
                  Google API Services User Data Policy
                </a>
                , including the <strong>Limited Use</strong> requirements.
              </p>
              <ul style={{ paddingLeft: "20px", margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                <li><strong>No Advertising:</strong> We never use or transfer Google Calendar user data for serving advertisements, retargeting, or interest-based profiling.</li>
                <li><strong>No Model Training:</strong> Google Calendar event data is never used to train or fine-tune general AI foundation models.</li>
                <li><strong>No Human Inspection:</strong> No human employees or contractors inspect your calendar events unless explicitly requested by you for technical troubleshooting or legally mandated.</li>
              </ul>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "16px", marginBottom: "8px" }}>
              Information Accessed and Operational Scope
            </h3>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Event Creation &amp; Synchronization:</strong> AuraMind creates and updates only calendar events specifically associated with your deliberate practice schedules. All events created by AuraMind are clearly designated with the <code>[AuraMind]</code> title prefix and include private application identifiers.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Schedule Conflict Checking:</strong> When requested, AuraMind reads event start and end times to identify potential overlaps with your personal commitments. AuraMind does not read, index, or store unrelated private event notes, attachments, or attendee lists.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Safe Deletion Boundaries:</strong> AuraMind only deletes calendar events that it positively created and manages. AuraMind will never modify or delete your external, unrelated personal or work calendar entries.
              </li>
            </ul>

            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "16px", marginBottom: "8px" }}>
              Token Security, Revocation &amp; Disconnection
            </h3>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>AES-256-GCM Encryption at Rest:</strong> Google OAuth refresh tokens are cryptographically encrypted at rest using industry-standard AES-256-GCM with distinct initialization vectors on secure server backends. Plaintext tokens are never stored or exposed to the client.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Instant Disconnection:</strong> You can disconnect Google Calendar at any time via <em>Settings &rarr; Google Calendar Integration &rarr; Disconnect</em>. Disconnection immediately deletes your stored token and revokes access at Google&rsquo;s OAuth server.
              </li>
              <li>
                <strong style={{ color: "var(--text-primary)" }}>Right to Erasure:</strong> When you delete your AuraMind account, all calendar connection records, access tokens, and event tracking IDs are permanently and irreversibly purged from our database.
              </li>
            </ul>
          </section>

          {/* SECTION 7 */}
          <section id="hosting">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              7. Hosting, Authentication and Database
            </h2>
            <p>AuraMind relies on verified, enterprise-grade cloud infrastructure providers to deliver its services:</p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Application Hosting:</strong> Vercel Inc. (serverless runtime and edge delivery).</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Database &amp; Authentication:</strong> Supabase Inc. (managed PostgreSQL database, authentication, and Row-Level Security enforcement).</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Model Inference:</strong> Google LLC (Google Cloud / Google AI Gemini platform).</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Calendar Synchronization:</strong> Google LLC (Google Calendar API v3 under Google API Services User Data Policy).</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Domain Research:</strong> Tavily Inc. (bounded search queries to retrieve pedagogical benchmarks).</li>
            </ul>
          </section>

          {/* SECTION 8 */}
          <section id="sharing">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              8. Sharing of Information
            </h2>
            <p>
              AuraMind does <strong>never sell, rent, trade, or monetize your personal information</strong>. Information is shared only with the operational infrastructure service providers listed in Section 7 solely to host the application, execute AI requests, maintain the database, and synchronize calendar events when explicitly authorized.
            </p>
            <p>
              We may disclose information only if required by a valid, legally binding court order or governmental authority under applicable law.
            </p>
          </section>

          {/* SECTION 9 */}
          <section id="retention">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              9. Data Retention
            </h2>
            <p>
              We retain your personal information, goal data, and progress metrics for as long as your account remains active.
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Account Data:</strong> Retained until you request account deletion.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Calendar Tokens &amp; Credentials:</strong> Retained in encrypted form only while Google Calendar integration is connected. Purged immediately upon disconnection or account deletion.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Transient Web Logs:</strong> Retained for a maximum of 30 days for security diagnostics before automated purging.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Consent Records:</strong> Retained for the statutory limitation period required under data protection regulations to demonstrate affirmative compliance.</li>
            </ul>
          </section>

          {/* SECTION 10 */}
          <section id="security">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              10. Data Security
            </h2>
            <p>We implement multi-layered technical and organizational safeguards:</p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Encryption in Transit:</strong> All HTTP traffic is enforced over TLS 1.3/HTTPS.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Encryption at Rest:</strong> All external API credentials, including Google OAuth refresh tokens, are encrypted with AES-256-GCM.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Row-Level Security (RLS):</strong> PostgreSQL database policies ensure that authenticated users can only query, read, or modify their own goals, profiles, calendar links, and consent records.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Cryptographic Hashing:</strong> Passwords are cryptographically salted and hashed via bcrypt before storage; plaintext passwords are never accessible.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Environment Secret Isolation:</strong> Server-side API keys (Google Gemini, Supabase Service Role, Google OAuth Client Secret) are kept in isolated server environments and never exposed in browser bundles.</li>
            </ul>
            <p style={{ fontSize: "0.875rem", fontStyle: "italic" }}>
              While we adhere to high security engineering standards, no internet transmission or electronic storage method can guarantee 100% absolute security.
            </p>
          </section>

          {/* SECTION 11 */}
          <section id="privacy-rights">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              11. User Privacy Rights (DPDP Act 2023 &amp; Global Standards)
            </h2>
            <p>
              In accordance with India&rsquo;s <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the Digital Personal Data Protection Rules, 2025, and international privacy principles, users possess the following rights regarding their digital personal data:
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li><strong style={{ color: "var(--text-primary)" }}>Right to Access Information:</strong> You may request a summary of your personal data processed by AuraMind and the processing activities undertaken.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Right to Correction &amp; Updating:</strong> You may update your profile details and goals at any time via your Settings console.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Right to Erasure / Deletion:</strong> You have the right to request the permanent deletion of your personal data when it is no longer necessary for the purpose for which it was processed.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Right to Withdraw Consent:</strong> Where processing is based on consent, you may withdraw that consent at any time without affecting the lawfulness of processing prior to withdrawal.</li>
              <li><strong style={{ color: "var(--text-primary)" }}>Right of Grievance Redressal:</strong> You have the right to readily accessible grievance redressal mechanisms regarding any act or omission of the data fiduciary.</li>
            </ul>
          </section>

          {/* SECTION 12 */}
          <section id="account-deletion">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              12. Account Deletion Workflow
            </h2>
            <p>
              Users can initiate permanent account deletion directly through their account settings or by submitting a formal deletion request.
            </p>
            <p>
              When an account is deleted:
            </p>
            <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <li>Your user profile, authentication record, and login credentials are permanently deleted from Supabase Auth.</li>
              <li>All associated 30-day goals, schedules, daily blocks, check-ins, focus session logs, and streak metrics are cascaded and erased from the active PostgreSQL database.</li>
              <li>Any optional marketing or communication enrollments are immediately terminated.</li>
              <li>Backups are rotated and permanently overwritten according to cloud provider retention lifecycles (typically within 30 days).</li>
            </ul>
          </section>

          {/* SECTION 13 */}
          <section id="minors">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              13. Minors and Children&rsquo;s Privacy
            </h2>
            <p>
              AuraMind is designed for adult professionals, university students, and self-directed learners aged 18 and older. Minors between the ages of 13 and 17 may use the platform only with the knowledge and affirmative consent of a parent or legal guardian.
            </p>
            <p>
              In accordance with Section 9 of India&rsquo;s DPDP Act, 2023, we do not knowingly process personal data of children under the age of 18 without verifiable parental consent, nor do we engage in targeted advertising, behavioral tracking, or profiling directed at minors. If you believe a child under the age of 18 has registered without parental authorization, please contact our Grievance Officer immediately for prompt account removal.
            </p>
          </section>

          {/* SECTION 14 */}
          <section id="international">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              14. International Data Processing
            </h2>
            <p>
              AuraMind&rsquo;s cloud infrastructure is hosted in enterprise data centers operated by Vercel and Supabase across secure cloud regions (including AWS and Google Cloud infrastructure). Depending on your location, your information may be processed in data centers located outside your jurisdiction. We ensure that all cross-border processing satisfies standard data protection clauses and statutory transfer requirements.
            </p>
          </section>

          {/* SECTION 15 */}
          <section id="changes">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              15. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect evolving legal standards or product enhancements. When material updates are published, we will update the version identifier (e.g. <code>2026-10-V1</code>) and post a prominent notice on the website or via email.
            </p>
            <p>
              <strong>No Silent Consent:</strong> We will never assume or manufacture renewed consent silently. If a revision requires new consent under applicable law, you will be prompted affirmatively.
            </p>
          </section>

          {/* SECTION 16 */}
          <section id="contact">
            <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", letterSpacing: "-0.02em" }}>
              16. Contact &amp; Grievance Redressal
            </h2>
            <p>
              If you have questions, feedback, or complaints regarding this Privacy Policy or wish to exercise your statutory privacy rights, please reach out to our designated Privacy &amp; Grievance Redressal channel:
            </p>
            <div
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                padding: "20px 24px",
                marginTop: "12px",
                fontSize: "0.9rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                AuraMind Privacy &amp; Grievance Redressal
              </div>
              <div>Grievance Officer: <strong>[GRIEVANCE_OFFICER_NAME — Configuration Placeholder]</strong></div>
              <div>Designation: <strong>Data Protection &amp; Grievance Officer</strong></div>
              <div>Email: <strong>[GRIEVANCE_OFFICER_EMAIL — placeholder: privacy@auramind.ai]</strong></div>
              <div>Address: <strong>[GRIEVANCE_OFFICER_ADDRESS — Configuration Placeholder]</strong></div>
              <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                We acknowledge grievances within 48 hours and strive to resolve formal privacy requests within 30 days in accordance with statutory guidelines.
              </div>
            </div>
          </section>

        </div>

        {/* BOTTOM BACK TO HOME */}
        <div style={{ marginTop: "60px", paddingTop: "24px", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="btn btn-secondary btn-sm" style={{ borderRadius: "8px" }}>
            ← Back to Home
          </Link>
          <Link href="/terms" className="btn btn-secondary btn-sm" style={{ borderRadius: "8px" }}>
            Read Terms &amp; Conditions →
          </Link>
        </div>
      </div>
    </div>
  );
}
