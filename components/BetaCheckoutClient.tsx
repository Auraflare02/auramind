"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuraMindLogo, AuraMindSymbol } from "@/components/AuraMindBrand";

export default function BetaCheckoutClient() {
  const router = useRouter();

  const [transactionId, setTransactionId] = useState("");
  const [senderNotes, setSenderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [userProfile, setUserProfile] = useState<{ id?: string; email?: string; full_name?: string } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Load authenticated user profile
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setUserProfile(data.user);
          }
        }
      } catch {
        // Guest mode fallback
      } finally {
        setIsLoadingAuth(false);
      }
    }
    loadUser();
  }, []);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const cleanTx = transactionId.trim();
    if (!cleanTx || cleanTx.length < 6) {
      setSubmitError("Please enter your complete 12-digit UPI Transaction ID / UTR reference number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: "beta",
          billingCycle: "monthly",
          amount: 99,
          transactionId: cleanTx,
          notes: senderNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit beta reservation.");
      }

      const reqId = data.request?.id || `pay_${Date.now()}`;
      router.push(
        `/payment/pending?id=${encodeURIComponent(reqId)}&tier=beta&amount=99&tx=${encodeURIComponent(cleanTx)}`
      );
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again or email ridhx02@gmail.com.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh", paddingBottom: "80px" }}>
      {/* HEADER BAR */}
      <div
        style={{
          borderBottom: "1px solid var(--border-default)",
          padding: "16px 24px",
          backgroundColor: "rgba(18, 18, 18, 0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1000px",
          }}
        >
          <AuraMindLogo height={28} />
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              className="badge badge-yellow"
              style={{ fontSize: "0.78rem", padding: "4px 10px", fontWeight: 800 }}
            >
              🚀 100-USER BETA PROGRAMME
            </span>
            <Link
              href="/beta"
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              &larr; Back to Beta Overview
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: "1000px", paddingTop: "40px" }}>
        {/* PAGE TITLE */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            <span style={{ fontSize: "1.4rem" }}>🎯</span>
            <span style={{ color: "var(--accent-primary)", fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Fast-Track Beta Access
            </span>
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 900, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Reserve Your AuraMind Beta Slot
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            One-time ₹99 fee for 20 days of complete access to our AI accountability engine, 30-day timetable generator, and hourly check-ins.
          </p>
        </div>

        {/* AUTH ALERT BANNER IF NOT LOGGED IN */}
        {!isLoadingAuth && !userProfile && (
          <div
            style={{
              backgroundColor: "rgba(255, 214, 0, 0.08)",
              border: "1px solid rgba(255, 214, 0, 0.3)",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.4rem" }}>👤</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>You are not logged in</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Please sign in or create an account first so we can link your 20-day beta pass to your profile.
                </div>
              </div>
            </div>
            <Link
              href="/login?next=/beta/checkout"
              className="btn btn-primary"
              style={{ padding: "8px 18px", fontSize: "0.85rem", fontWeight: 700 }}
            >
              Sign In to Continue &rarr;
            </Link>
          </div>
        )}

        {/* LOGGED IN USER PILL */}
        {userProfile && (
          <div
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "10px",
              padding: "12px 18px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.1rem" }}>✓</span>
              <span style={{ fontSize: "0.88rem", color: "#A7F3D0" }}>
                Activating beta pass for:{" "}
                <strong style={{ color: "#FFFFFF" }}>{userProfile.full_name || userProfile.email}</strong>{" "}
                ({userProfile.email})
              </span>
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>User ID: {userProfile.id?.slice(0, 8)}...</span>
          </div>
        )}

        {/* MAIN 2-COLUMN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* LEFT: PAYMENT SCANNER & FORM */}
          <div
            className="card"
            style={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "16px",
              padding: "28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <span
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-primary)",
                  color: "#000000",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                }}
              >
                1
              </span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                Scan &amp; Pay via UPI
              </h2>
            </div>

            {/* QR CODE DISPLAY */}
            <div
              style={{
                backgroundColor: "#0F0F0F",
                border: "1px solid var(--border-default)",
                borderRadius: "14px",
                padding: "20px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  padding: "12px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  marginBottom: "14px",
                }}
              >
                <img
                  src="/payments/auramind-upi-qr.jpg"
                  alt="AuraMind UPI QR Code"
                  style={{
                    width: "200px",
                    height: "200px",
                    objectFit: "contain",
                    display: "block",
                  }}
                />
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                  Exact Beta Fee
                </div>
                <div
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 900,
                    color: "var(--accent-primary)",
                    margin: "2px 0 6px",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ₹99
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Scan with Google Pay, PhonePe, Paytm, BHIM, or any bank UPI app
                </div>
              </div>
            </div>

            {/* FORM: TRANSACTION ID */}
            <form onSubmit={handleSubmitPayment}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px", marginTop: "24px" }}>
                <span
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-primary)",
                    color: "#000000",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                  }}
                >
                  2
                </span>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                  Enter UPI Reference / UTR Number
                </h2>
              </div>

              {submitError && (
                <div
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#FCA5A5",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    marginBottom: "16px",
                  }}
                >
                  {submitError}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="transactionId"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}
                >
                  12-Digit UPI Transaction ID / UTR <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  id="transactionId"
                  type="text"
                  required
                  placeholder="e.g. 431289012345 or T26110..."
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    backgroundColor: "#141414",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "1rem",
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                  }}
                />
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Shown on your UPI payment confirmation as &ldquo;UPI Ref No.&rdquo; or &ldquo;UTR&rdquo;.
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="senderNotes"
                  style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}
                >
                  Optional Sender Name or Note
                </label>
                <input
                  id="senderNotes"
                  type="text"
                  placeholder="e.g. Paid via HDFC GPay / Rahul"
                  value={senderNotes}
                  onChange={(e) => setSenderNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    backgroundColor: "#141414",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" style={{ width: "18px", height: "18px" }}></span>
                    Submitting Reservation Proof...
                  </>
                ) : (
                  <>
                    <span>🚀 Confirm ₹99 Beta Reservation</span>
                  </>
                )}
              </button>

              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  🔒 Fast manual verification within 6 hours &bull; Zero auto-debit &bull; 20-day pass
                </span>
              </div>
            </form>
          </div>

          {/* RIGHT: BETA PROGRAMME DETAILS & PERKS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* SUMMARY CARD */}
            <div
              className="card"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--accent-primary)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: "0 0 24px rgba(255, 214, 0, 0.08)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span className="badge badge-yellow" style={{ fontSize: "0.78rem", fontWeight: 800 }}>
                  20 DAYS FULL ACCESS
                </span>
                <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--accent-primary)" }}>
                  ₹99
                </span>
              </div>

              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 12px" }}>
                What&apos;s Included in Your Beta Pass
              </h3>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  "Complete AI Goal Research & Structured Milestones",
                  "Personalized 30-Day Step-by-Step Timetable",
                  "Hourly In-App Accountability Check-ins",
                  "Productivity Timer with Focus XP & Streaks",
                  "Missed-Task Recovery Assistance",
                  "Daily & Weekly Progress Reports",
                  "Add up to 5 Friends for Mutual Encouragement",
                  "Direct Feedback Channel to the Engineering Team",
                ].map((item, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--accent-primary)", fontWeight: 900 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-default)",
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                }}
              >
                <strong>Transparent Notice:</strong> WhatsApp reminders and Bland AI voice calls are currently in private developer testing/carrier approval and are not operational in this beta tier.
              </div>
            </div>

            {/* BETA FAQ / GUARANTEES */}
            <div
              className="card"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-default)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <h4 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 14px" }}>
                Beta Programme Guidelines
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <div>
                  <strong style={{ color: "#FFFFFF" }}>How long does verification take?</strong>
                  <p style={{ margin: "2px 0 0", color: "var(--text-muted)" }}>
                    Our team manually validates each UPI transaction within 6 hours. You will receive an in-app confirmation once active.
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#FFFFFF" }}>Will my card or account be auto-debited?</strong>
                  <p style={{ margin: "2px 0 0", color: "var(--text-muted)" }}>
                    Never. This is a one-time direct bank transfer of ₹99 via UPI. There is zero automatic renewal or recurring fee.
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#FFFFFF" }}>How do I report issues during the beta?</strong>
                  <p style={{ margin: "2px 0 0", color: "var(--text-muted)" }}>
                    Beta users get an exclusive &ldquo;Submit Feedback&rdquo; button directly on the dashboard to report bugs and suggest improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
