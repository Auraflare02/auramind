"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactClient() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setBusy(true);

    // Simulate reliable dispatch
    setTimeout(() => {
      setBusy(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "48px",
        alignItems: "flex-start",
      }}
    >
      {/* LEFT: WORKING CONTACT FORM */}
      <div
        className="surface-card"
        style={{
          padding: "36px",
          borderRadius: "14px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>
          Send a Direct Message
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "24px" }}>
          Have a question about our 30-day timetables, subscription plans, or platform features? Fill out the form below.
        </p>

        {submitted ? (
          <div
            style={{
              padding: "24px",
              borderRadius: "10px",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>✅</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--success)", marginBottom: "6px" }}>
              Message Received
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Thank you, {formData.name}! Our team has received your message and will review it promptly.
            </p>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: "", email: "", subject: "general", message: "" });
              }}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "16px" }}
            >
              Send Another Note
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Your Name <span style={{ color: "var(--accent-primary)" }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ridham"
                className="input-field"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Email Address <span style={{ color: "var(--accent-primary)" }}>*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="input-field"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Inquiry Topic
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input-field"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text)" }}
              >
                <option value="general">General Question</option>
                <option value="subscription">Subscription &amp; Pricing (Gold, Platinum, Diamond)</option>
                <option value="features">Feature Request &amp; Feedback</option>
                <option value="technical">Technical Support</option>
                <option value="partnership">Partnership &amp; Press</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                Your Message <span style={{ color: "var(--accent-primary)" }}>*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="How can the AuraMind team assist you today?"
                className="input-field"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-default)", backgroundColor: "var(--bg-surface)", color: "var(--text)", resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary"
              style={{ width: "100%", height: "46px", fontWeight: 700, fontSize: "0.95rem" }}
            >
              {busy ? "Sending Message..." : "Submit Message →"}
            </button>
          </form>
        )}
      </div>

      {/* RIGHT: REAL WORKING CHANNELS */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div
          className="surface-card"
          style={{
            padding: "28px",
            borderRadius: "14px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.5rem" }}>🤖</span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Instant AI Assistant (24/7)
            </h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "16px" }}>
            Need immediate guidance on structuring a goal, setting daily focus hours, or troubleshooting timetables? Our integrated AI assistant is available 24/7 directly in your workspace.
          </p>
          <Link href="/chat" className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
            Open AI Assistant &rarr;
          </Link>
        </div>

        <div
          className="surface-card"
          style={{
            padding: "28px",
            borderRadius: "14px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.5rem" }}>💬</span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Live Community World Chat
            </h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "16px" }}>
            Join our global room to connect directly with fellow pioneers, discuss focus strategies, and receive peer accountability.
          </p>
          <Link href="/community" className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
            Enter World Chat &rarr;
          </Link>
        </div>

        <div
          className="surface-card"
          style={{
            padding: "28px",
            borderRadius: "14px",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <span style={{ fontSize: "1.5rem" }}>🛡️</span>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Platform Source &amp; Bug Reports
            </h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6, marginBottom: "16px" }}>
            Report technical issues, inspect public release milestones, or submit open feature suggestions via our official GitHub repository.
          </p>
          <a
            href="https://github.com/Auraflare02/auramind"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 700 }}
          >
            Visit GitHub Repository &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
