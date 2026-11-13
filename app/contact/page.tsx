import type { Metadata } from "next";
import ContactClient from "@/components/ContactClient";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "Contact AuraMind – Get in Touch & Support",
  description:
    "Have questions about AuraMind's AI goal planner, subscription tiers, or technical integrations? Reach out to our team through our direct contact form or 24/7 AI support.",
  path: "/contact",
  keywords: [
    "Contact AuraMind",
    "AuraMind support",
    "AuraMind feedback",
    "AI productivity help",
    "subscription inquiry",
  ],
});

export default function ContactPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ]);

  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <JsonLd data={breadcrumbs} />

      {/* HERO HEADER */}
      <section
        style={{
          paddingTop: "72px",
          paddingBottom: "48px",
          borderBottom: "1px solid var(--border-default)",
          background: "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 0, 0.08) 0%, rgba(8, 8, 8, 0) 70%)",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: "800px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
              Help &amp; Direct Support
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginBottom: "16px" }}>
            Contact the AuraMind Team
          </h1>

          <p className="lead" style={{ maxWidth: "680px", margin: "0 auto", color: "var(--text-secondary)" }}>
            We are here to help you get the most out of your 30-day goal timetables, accountability integrations, and productivity systems.
          </p>
        </div>
      </section>

      {/* CONTACT FORM & CHANNELS */}
      <section style={{ padding: "64px 0 96px" }}>
        <div className="container" style={{ maxWidth: "1040px" }}>
          <ContactClient />
        </div>
      </section>
    </div>
  );
}
