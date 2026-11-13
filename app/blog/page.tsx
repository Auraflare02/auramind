import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata, getBreadcrumbSchema } from "@/lib/seo/config";
import { BLOG_POSTS } from "@/lib/blog/posts";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "AuraMind Blog – AI Productivity, Goal Planning & Accountability Guides",
  description:
    "Actionable insights on goal execution, deliberate practice, AI accountability, and habit building from the AuraMind team. Master your 30-day productivity sprints.",
  path: "/blog",
  keywords: [
    "AuraMind blog",
    "AI productivity guides",
    "goal planning articles",
    "habit building science",
    "deliberate practice strategies",
    "AI accountability tips",
  ],
});

export default function BlogIndexPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
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
          background: "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 0, 0.08) 0%, rgba(8, 8, 8, 0) 70%)",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: "860px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
              Behavioral Science &bull; Execution Playbooks
            </span>
          </div>

          <h1 className="display-title" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", marginBottom: "20px" }}>
            AuraMind Blog &bull; Productivity, AI &amp; Accountability
          </h1>

          <p className="lead" style={{ maxWidth: "700px", margin: "0 auto", color: "var(--text-secondary)" }}>
            In-depth research, deliberate practice blueprints, and practical mental models to help you close the gap between ambition and daily output.
          </p>
        </div>
      </section>

      {/* 2. ARTICLES GRID */}
      <section style={{ padding: "72px 0 96px" }}>
        <div className="container" style={{ maxWidth: "1080px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "32px",
            }}
          >
            {BLOG_POSTS.map((post) => (
              <article
                key={post.slug}
                className="surface-card"
                style={{
                  borderRadius: "14px",
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s ease, border-color 0.2s ease",
                }}
              >
                <div style={{ padding: "28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
                    {post.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          backgroundColor: "var(--bg-surface)",
                          color: "var(--accent-primary)",
                          border: "1px solid var(--border-subtle)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                      {post.readTime}
                    </span>
                  </div>

                  <h2 style={{ fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.4, marginBottom: "12px" }}>
                    <Link
                      href={`/blog/${post.slug}`}
                      style={{ color: "var(--text)", textDecoration: "none", transition: "color 0.2s ease" }}
                    >
                      {post.title}
                    </Link>
                  </h2>

                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                    {post.excerpt}
                  </p>
                </div>

                <div
                  style={{
                    padding: "16px 28px",
                    borderTop: "1px solid var(--border-subtle)",
                    backgroundColor: "var(--bg-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {new Date(post.datePublished).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--accent-primary)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Read Guide &rarr;
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CTA */}
      <section
        style={{
          padding: "64px 0",
          borderTop: "1px solid var(--border-default)",
          backgroundColor: "var(--bg-secondary)",
          textAlign: "center",
        }}
      >
        <div className="container" style={{ maxWidth: "680px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "12px" }}>
            Ready to Put These Principles into Practice?
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "28px" }}>
            Create your first goal and let AuraMind build a personalized 30-day execution timetable.
          </p>
          <Link href="/#create-goal" className="btn btn-primary btn-lg">
            Start Your 30-Day Goal Now &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}
