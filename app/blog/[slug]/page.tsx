import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS, getBlogPostBySlug } from "@/lib/blog/posts";
import { constructMetadata, getBreadcrumbSchema, getArticleSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPostBySlug(params.slug);
  if (!post) return {};

  return constructMetadata({
    title: post.metaTitle,
    description: post.metaDescription,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.datePublished,
    modifiedTime: post.dateModified,
    keywords: post.tags,
  });
}

export default function BlogPostPage({ params }: Props) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);

  const articleSchema = getArticleSchema({
    title: post.title,
    description: post.metaDescription,
    path: `/blog/${post.slug}`,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    authorName: post.author.name,
  });

  // Split content sections by headings
  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh" }}>
      <JsonLd data={[breadcrumbs, articleSchema]} />

      {/* ARTICLE HEADER */}
      <header
        style={{
          paddingTop: "64px",
          paddingBottom: "48px",
          borderBottom: "1px solid var(--border-default)",
          background: "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 0, 0.08) 0%, rgba(8, 8, 8, 0) 70%)",
        }}
      >
        <div className="container" style={{ maxWidth: "820px" }}>
          {/* Breadcrumb Navigation in UI */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: "20px", fontSize: "0.825rem", color: "var(--text-muted)" }}>
            <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Home
            </Link>
            <span style={{ margin: "0 8px" }}>/</span>
            <Link href="/blog" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
              Blog
            </Link>
            <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--accent-primary)" }}>{post.tags[0] || "Guide"}</span>
          </nav>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255, 214, 0, 0.12)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(255, 214, 0, 0.3)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          <h1
            className="display-title"
            style={{
              fontSize: "clamp(2rem, 3.8vw, 3rem)",
              lineHeight: 1.25,
              marginBottom: "20px",
              color: "#FFFFFF",
            }}
          >
            {post.title}
          </h1>

          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "24px" }}>
            {post.excerpt}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              flexWrap: "wrap",
              paddingTop: "16px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "0.85rem",
              color: "var(--text-muted)",
            }}
          >
            <div>
              <strong style={{ color: "var(--text-primary)" }}>{post.author.name}</strong>
              <span style={{ margin: "0 8px" }}>&bull;</span>
              <span>{post.author.role}</span>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "12px" }}>
              <span>Published: {new Date(post.datePublished).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span>&bull;</span>
              <span>{post.readTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ARTICLE BODY */}
      <main style={{ padding: "64px 0 96px" }}>
        <div className="container" style={{ maxWidth: "820px" }}>
          <div
            className="blog-content"
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.85,
              color: "#E2E8F0",
            }}
          >
            {/* Simple Markdown Parser for clean headings, lists, bold, and links */}
            {post.content
              .trim()
              .split("\n\n")
              .map((block, idx) => {
                const trimmed = block.trim();
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2
                      key={idx}
                      style={{
                        fontSize: "1.75rem",
                        fontWeight: 800,
                        color: "#FFFFFF",
                        marginTop: "48px",
                        marginBottom: "18px",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }
                if (trimmed.startsWith("### ")) {
                  return (
                    <h3
                      key={idx}
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color: "var(--accent-primary)",
                        marginTop: "32px",
                        marginBottom: "12px",
                      }}
                    >
                      {trimmed.replace("### ", "")}
                    </h3>
                  );
                }
                if (trimmed.startsWith("---")) {
                  return <hr key={idx} style={{ border: "none", borderTop: "1px solid var(--border-subtle)", margin: "40px 0" }} />;
                }
                if (trimmed.startsWith("- ") || trimmed.startsWith("1. ") || trimmed.startsWith("2. ")) {
                  const items = trimmed.split("\n").filter((l) => l.trim().length > 0);
                  return (
                    <ul key={idx} style={{ paddingLeft: "24px", margin: "16px 0", color: "var(--text-secondary)" }}>
                      {items.map((it, itemIdx) => {
                        const cleanItem = it.replace(/^[-*]|\d+\.\s+/, "").trim();
                        return (
                          <li
                            key={itemIdx}
                            style={{ marginBottom: "10px" }}
                            dangerouslySetInnerHTML={{
                              __html: cleanItem
                                .replace(/\*\*(.*?)\*\*/g, "<strong style='color:#FFFFFF'>$1</strong>")
                                .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' style='color:var(--accent-primary);text-decoration:underline;'>$1</a>"),
                            }}
                          />
                        );
                      })}
                    </ul>
                  );
                }
                return (
                  <p
                    key={idx}
                    style={{ marginBottom: "22px" }}
                    dangerouslySetInnerHTML={{
                      __html: trimmed
                        .replace(/\*\*(.*?)\*\*/g, "<strong style='color:#FFFFFF'>$1</strong>")
                        .replace(/\*(.*?)\*/g, "<em>$1</em>")
                        .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' style='color:var(--accent-primary);text-decoration:underline;'>$1</a>"),
                    }}
                  />
                );
              })}
          </div>

          {/* IN-ARTICLE CONTEXTUAL CALLOUT */}
          <div
            style={{
              margin: "56px 0 40px",
              padding: "32px",
              borderRadius: "14px",
              backgroundColor: "var(--bg-card)",
              border: "1px solid rgba(255, 214, 0, 0.35)",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFFFFF", marginBottom: "8px" }}>
              Put This Strategy Into Practice in 60 Seconds
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto 20px" }}>
              AuraMind transforms these behavioral insights into your personal 30-day timetable with hourly check-ins.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/#create-goal" className="btn btn-primary">
                Generate 30-Day Plan &rarr;
              </Link>
              <Link href="/pricing" className="btn btn-secondary">
                View Subscription Plans
              </Link>
            </div>
          </div>

          {/* RELATED GUIDES */}
          {otherPosts.length > 0 && (
            <div style={{ marginTop: "64px", paddingTop: "40px", borderTop: "1px solid var(--border-default)" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "20px" }}>
                Related Productivity Guides
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "18px" }}>
                {otherPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    style={{
                      padding: "18px",
                      borderRadius: "10px",
                      backgroundColor: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      textDecoration: "none",
                      display: "block",
                      transition: "border-color 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700, marginBottom: "6px" }}>
                      {related.tags[0]}
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.4 }}>
                      {related.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
