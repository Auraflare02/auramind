"use client";

import { useState } from "react";
import { FeedbackCategory, FeedbackPriority } from "@/lib/feedback/types";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: FeedbackCategory;
  defaultFeature?: string;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  defaultCategory = "bug",
  defaultFeature = "",
}: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>(defaultCategory);
  const [feature, setFeature] = useState(defaultFeature);
  const [description, setDescription] = useState("");
  const [satisfactionRating, setSatisfactionRating] = useState<number>(5);
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!description.trim() || description.trim().length < 5) {
      setSubmitError("Please write at least a few words describing your experience or issue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          feature: feature.trim() || undefined,
          description: description.trim(),
          satisfactionRating,
          priority,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit feedback.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDescription("");
        onClose();
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          backgroundColor: "#121212",
          border: "1px solid var(--accent-primary)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "28px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.4rem" }}>💬</span>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>
              Beta Feedback &amp; Bug Report
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.4rem",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            &times;
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: "center", padding: "40px 10px" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#10B981", margin: "0 0 8px" }}>
              Feedback Received!
            </h4>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
              Thank you for helping us polish AuraMind for the first 100 beta users.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: 0, marginBottom: "18px" }}>
              Help us make AuraMind reliable and fast. Your feedback goes directly to our engineering team.
            </p>

            {submitError && (
              <div
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#FCA5A5",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                }}
              >
                {submitError}
              </div>
            )}

            {/* CATEGORY SELECTOR */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-muted)" }}>
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#181818",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                }}
              >
                <option value="bug">🐛 Bug / Technical Error</option>
                <option value="ai_quality">🤖 AI Plan Quality / Accuracy</option>
                <option value="timetable">📅 30-Day Timetable Feedback</option>
                <option value="performance">⚡ Speed / Latency / Performance</option>
                <option value="ux">🎨 Design / User Experience</option>
                <option value="feature_request">💡 Feature Request</option>
                <option value="other">💬 General Feedback</option>
              </select>
            </div>

            {/* AFFECTED FEATURE (OPTIONAL) */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-muted)" }}>
                AFFECTED FEATURE (OPTIONAL)
              </label>
              <input
                type="text"
                placeholder="e.g. AI Goal Submission, Timer, Login, Timetable"
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#181818",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                }}
              />
            </div>

            {/* PRIORITY SELECTION */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-muted)" }}>
                SEVERITY / PRIORITY
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {(["low", "medium", "high", "critical"] as FeedbackPriority[]).map((p) => {
                  const isSel = priority === p;
                  const color =
                    p === "critical"
                      ? "#EF4444"
                      : p === "high"
                      ? "#F97316"
                      : p === "medium"
                      ? "#EAB308"
                      : "#10B981";

                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      style={{
                        padding: "8px 6px",
                        borderRadius: "6px",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        cursor: "pointer",
                        border: isSel ? `2px solid ${color}` : "1px solid var(--border-default)",
                        backgroundColor: isSel ? `${color}22` : "#181818",
                        color: isSel ? color : "var(--text-muted)",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SATISFACTION RATING (1-5 STARS) */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-muted)" }}>
                YOUR CURRENT EXPERIENCE (1-5 STARS)
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setSatisfactionRating(star)}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontSize: "1.6rem",
                      cursor: "pointer",
                      padding: "2px",
                      filter: star <= satisfactionRating ? "none" : "grayscale(100%) opacity(30%)",
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-muted)" }}>
                DETAILS &amp; STEPS TO REPRODUCE <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <textarea
                required
                rows={4}
                placeholder="What happened? What did you expect to happen? Any specific details help us fix it faster..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  backgroundColor: "#181818",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {/* ACTIONS */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: "10px 18px", fontSize: "0.9rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  padding: "10px 22px",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: "16px", height: "16px" }}></span>
                    Sending...
                  </>
                ) : (
                  <>🚀 Submit Beta Feedback</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
