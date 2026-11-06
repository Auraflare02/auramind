"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS, COMPARISON_TABLE_ROWS, THREE_LEVELS_PHILOSOPHY } from "@/lib/subscription/config";
import { SubscriptionTier, BillingCycle, UserSubscription } from "@/lib/subscription/types";

export default function PricingClient() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlanModal, setSelectedPlanModal] = useState<SubscriptionTier | null>(null);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // UPI Payment states
  const [transactionId, setTransactionId] = useState<string>("");
  const [payerNote, setPayerNote] = useState<string>("");
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);
  const [userPaymentRequests, setUserPaymentRequests] = useState<any[]>([]);

  // Load user subscription and authentication state
  const loadPaymentStatus = async () => {
    try {
      const res = await fetch("/api/payments/status");
      if (res.ok) {
        const data = await res.json();
        if (data.requests && Array.isArray(data.requests)) {
          setUserPaymentRequests(data.requests);
        }
      }
    } catch (err) {
      console.warn("Failed to load payment requests:", err);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.isAuthenticated);
          setUserSubscription(data.userSubscription);
        }
        await loadPaymentStatus();
      } catch (err) {
        console.error("Failed to load subscription data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectPlan = (tier: SubscriptionTier) => {
    setSelectedPlanModal(tier);
    setTransactionId("");
    setPayerNote("");
    setSubmittedSuccess(false);
    setFeedbackMessage(null);
  };

  const planConfig = selectedPlanModal ? SUBSCRIPTION_PLANS[selectedPlanModal] : null;
  const payableAmount = planConfig
    ? billingCycle === "annual"
      ? planConfig.annualPriceMonthly * 12
      : planConfig.monthlyPriceIntro || planConfig.monthlyPriceRegular
    : 0;

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanModal) return;

    if (!transactionId.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Please enter your 12-digit UPI Transaction ID / UTR reference number.",
      });
      return;
    }

    if (!isAuthenticated) {
      window.location.href = `/login?next=/pricing?plan=${selectedPlanModal}`;
      return;
    }

    setIsProcessingUpgrade(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tier: selectedPlanModal,
          cycle: billingCycle,
          amount: payableAmount,
          transactionId: transactionId.trim(),
          notes: payerNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payment.");
      }

      setSubmittedSuccess(true);
      await loadPaymentStatus();
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "An error occurred while submitting your transaction.",
      });
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  const activeTier = userSubscription?.tier || "gold";
  const pendingRequest = userPaymentRequests.find((r) => r.status === "pending");

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh" }}>
      {/* 1. HERO HEADER */}
      <section
        style={{
          paddingTop: "64px",
          paddingBottom: "48px",
          textAlign: "center",
          borderBottom: "1px solid var(--border-default)",
          background: "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 0, 0.08) 0%, rgba(8, 8, 8, 0) 70%)",
        }}
      >
        <div className="container" style={{ maxWidth: "880px" }}>
          {/* Active Pending Payment Request Banner */}
          {pendingRequest && (
            <div
              style={{
                marginBottom: "24px",
                padding: "16px 20px",
                borderRadius: "12px",
                backgroundColor: "rgba(255, 214, 0, 0.12)",
                border: "1px solid rgba(255, 214, 0, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.4rem" }}>⏳</span>
                <div>
                  <div style={{ fontWeight: 800, color: "var(--accent-primary)", fontSize: "0.95rem" }}>
                    Payment Verification Pending ({SUBSCRIPTION_PLANS[pendingRequest.tier as SubscriptionTier]?.name || pendingRequest.tier})
                  </div>
                  <div style={{ fontSize: "0.825rem", color: "var(--text-secondary)" }}>
                    Transaction ID: <strong style={{ color: "#FFFFFF", fontFamily: "monospace" }}>#{pendingRequest.transactionId}</strong> &bull; Amount: ₹{pendingRequest.amount} &bull; Admin turnaround: within 6 hours.
                  </div>
                </div>
              </div>
              <span className="badge badge-yellow" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                Under Review
              </span>
            </div>
          )}

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <span className="badge badge-yellow" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
              AuraMind Subscriptions
            </span>
            <span className="badge badge-neutral" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>
              AI & Human Social Accountability
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: "0 0 16px",
              lineHeight: 1.15,
            }}
          >
            Choose Your <span style={{ color: "var(--accent-primary)" }}>Accountability Power</span>
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--text-secondary)",
              maxWidth: "680px",
              margin: "0 auto 28px",
              lineHeight: 1.6,
            }}
          >
            From essential goal structuring to proactive WhatsApp reminders, natural Hindi AI phone calls,
            and full Google Calendar synchronization.
          </p>

          {/* Billing Toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: "#161616",
              padding: "4px",
              borderRadius: "9999px",
              border: "1px solid var(--border-default)",
              marginBottom: "12px",
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              style={{
                padding: "8px 22px",
                borderRadius: "9999px",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: billingCycle === "monthly" ? "var(--accent-primary)" : "transparent",
                color: billingCycle === "monthly" ? "#000" : "var(--text-secondary)",
              }}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("annual")}
              style={{
                padding: "8px 22px",
                borderRadius: "9999px",
                border: "none",
                fontSize: "0.9rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: billingCycle === "annual" ? "var(--accent-primary)" : "transparent",
                color: billingCycle === "annual" ? "#000" : "var(--text-secondary)",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>Annual Billing</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  backgroundColor: billingCycle === "annual" ? "#000" : "rgba(255, 214, 0, 0.2)",
                  color: billingCycle === "annual" ? "var(--accent-primary)" : "var(--accent-primary)",
                  padding: "1px 6px",
                  borderRadius: "9999px",
                  fontWeight: 800,
                }}
              >
                Save ~25%
              </span>
            </button>
          </div>

          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            Introductory pricing applied automatically. Cancel or upgrade anytime with zero penalties.
          </div>
        </div>
      </section>

      {/* 2. THE THREE PRICING CARDS */}
      <section style={{ padding: "56px 0 80px" }}>
        <div className="container" style={{ maxWidth: "1200px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "28px",
              alignItems: "stretch",
            }}
          >
            {/* 1. GOLD PLAN */}
            <PlanCard
              plan={SUBSCRIPTION_PLANS.gold}
              billingCycle={billingCycle}
              isCurrentPlan={isAuthenticated && activeTier === "gold"}
              onSelect={() => handleSelectPlan("gold")}
            />

            {/* 2. PLATINUM PLAN (MOST POPULAR) */}
            <PlanCard
              plan={SUBSCRIPTION_PLANS.platinum}
              billingCycle={billingCycle}
              isCurrentPlan={isAuthenticated && activeTier === "platinum"}
              onSelect={() => handleSelectPlan("platinum")}
              featured={true}
            />

            {/* 3. DIAMOND PLAN */}
            <PlanCard
              plan={SUBSCRIPTION_PLANS.diamond}
              billingCycle={billingCycle}
              isCurrentPlan={isAuthenticated && activeTier === "diamond"}
              onSelect={() => handleSelectPlan("diamond")}
              diamondGlow={true}
            />
          </div>
        </div>
      </section>

      {/* 3. AURAMIND'S THREE LEVELS PHILOSOPHY */}
      <section
        style={{
          padding: "64px 0",
          backgroundColor: "#0D0D0D",
          borderTop: "1px solid var(--border-default)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div className="container" style={{ maxWidth: "1100px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>
              Core Philosophy
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 10px" }}>
              AuraMind&rsquo;s Three Levels of Accountability
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "600px", margin: "0 auto" }}>
              Every level is calibrated to match your current discipline threshold and external accountability needs.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            {THREE_LEVELS_PHILOSOPHY.map((lvl) => (
              <div
                key={lvl.tier}
                style={{
                  backgroundColor: "#141414",
                  border: `1px solid ${
                    lvl.tier === "platinum"
                      ? "rgba(255, 214, 0, 0.4)"
                      : lvl.tier === "diamond"
                      ? "rgba(56, 189, 248, 0.4)"
                      : "var(--border-default)"
                  }`,
                  borderRadius: "16px",
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>{lvl.icon}</div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color:
                        lvl.tier === "platinum"
                          ? "var(--accent-primary)"
                          : lvl.tier === "diamond"
                          ? "#38BDF8"
                          : "#EAB308",
                      marginBottom: "4px",
                    }}
                  >
                    {lvl.title}
                  </div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, margin: "0 0 12px", color: "#FFFFFF" }}>
                    {lvl.subtitle}
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                    {lvl.desc}
                  </p>
                </div>
                <div style={{ marginTop: "24px" }}>
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(lvl.tier)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Explore {lvl.title} &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. COMPREHENSIVE PLAN COMPARISON TABLE */}
      <section style={{ padding: "72px 0", borderBottom: "1px solid var(--border-default)" }}>
        <div className="container" style={{ maxWidth: "1100px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>
              Feature Matrix
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 10px" }}>
              Side-by-Side Plan Comparison
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Review the exact allowances, check-in channels, and AI capabilities for each plan.
            </p>
          </div>

          <div
            style={{
              overflowX: "auto",
              backgroundColor: "#111111",
              borderRadius: "16px",
              border: "1px solid var(--border-default)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.92rem",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)", backgroundColor: "#181818" }}>
                  <th style={{ padding: "18px 24px", color: "var(--text-secondary)", fontWeight: 600, width: "35%" }}>
                    Features & Allowances
                  </th>
                  <th style={{ padding: "18px 20px", fontWeight: 800, color: "#EAB308", textAlign: "center", width: "21%" }}>
                    <div>🥇 GOLD</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "2px" }}>
                      Essential
                    </div>
                  </th>
                  <th
                    style={{
                      padding: "18px 20px",
                      fontWeight: 800,
                      color: "var(--accent-primary)",
                      textAlign: "center",
                      backgroundColor: "rgba(255, 214, 0, 0.05)",
                      width: "22%",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: "-1px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        backgroundColor: "var(--accent-primary)",
                        color: "#000",
                        fontSize: "0.65rem",
                        fontWeight: 900,
                        padding: "2px 8px",
                        borderRadius: "0 0 6px 6px",
                      }}
                    >
                      POPULAR
                    </div>
                    <div style={{ marginTop: "4px" }}>🥈 PLATINUM</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "2px" }}>
                      Smart AI
                    </div>
                  </th>
                  <th style={{ padding: "18px 20px", fontWeight: 800, color: "#38BDF8", textAlign: "center", width: "22%" }}>
                    <div>💎 DIAMOND</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, marginTop: "2px" }}>
                      Complete
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_TABLE_ROWS.map((row, idx) => (
                  <tr
                    key={row.feature}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)",
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 24px",
                        fontWeight: row.highlight ? 700 : 500,
                        color: row.highlight ? "#FFFFFF" : "var(--text-secondary)",
                      }}
                    >
                      {row.feature}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "center" }}>
                      {renderCellContent(row.gold)}
                    </td>
                    <td
                      style={{
                        padding: "14px 20px",
                        textAlign: "center",
                        backgroundColor: "rgba(255, 214, 0, 0.03)",
                      }}
                    >
                      {renderCellContent(row.platinum)}
                    </td>
                    <td style={{ padding: "14px 20px", textAlign: "center" }}>
                      {renderCellContent(row.diamond)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. DETAILED FEATURE BREAKDOWN BY TIER */}
      <section style={{ padding: "64px 0 80px" }}>
        <div className="container" style={{ maxWidth: "1100px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span className="badge badge-yellow" style={{ marginBottom: "8px" }}>
              In-Depth Specifications
            </span>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 10px" }}>
              Everything Included in Each Plan
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              A full breakdown of capabilities, notifications, and accountability safeguards.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
            {/* GOLD DETAILED BREAKDOWN */}
            <PlanDeepDiveSection plan={SUBSCRIPTION_PLANS.gold} />

            {/* PLATINUM DETAILED BREAKDOWN */}
            <PlanDeepDiveSection plan={SUBSCRIPTION_PLANS.platinum} />

            {/* DIAMOND DETAILED BREAKDOWN */}
            <PlanDeepDiveSection plan={SUBSCRIPTION_PLANS.diamond} />
          </div>
        </div>
      </section>

      {/* 6. COMPLIANCE & IMPORTANT NOTES */}
      <section
        style={{
          padding: "48px 0",
          backgroundColor: "#0F0F0F",
          borderTop: "1px solid var(--border-default)",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <div className="container" style={{ maxWidth: "900px", textAlign: "center" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "0 0 10px", color: "var(--text-primary)" }}>
            Consumer Protections &amp; Transparent Terms
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
            Prices reflect monthly usage allowances. WhatsApp messaging and AI phone calling require explicit
            user consent and an active phone number. Gold plan users receive in-app notification check-ins only, with zero phone intrusion.
            Subscriptions are billed in INR and can be canceled anytime in your account settings.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "18px", fontSize: "0.85rem", flexWrap: "wrap" }}>
            <Link href="/faq" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
              Pricing &amp; Feature FAQ &rarr;
            </Link>
            <Link href="/refund-policy" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 600 }}>
              Cancellation &amp; Refund Policy &rarr;
            </Link>
            <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Terms of Service &rarr;
            </Link>
            <Link href="/privacy-policy" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              Privacy Policy &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 7. UPI QR CODE PAYMENT & ACTIVATION MODAL */}
      {selectedPlanModal && planConfig && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: "520px",
              width: "100%",
              backgroundColor: "#121212",
              border: "1px solid var(--border-default)",
              borderRadius: "20px",
              padding: "28px 24px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedPlanModal(null)}
              aria-label="Close Payment Modal"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "1.3rem",
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              ✕
            </button>

            {submittedSuccess ? (
              /* SUCCESS CONFIRMATION STATE */
              <div style={{ textAlign: "center", padding: "16px 8px" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    border: "2px solid #10B981",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    margin: "0 auto 16px",
                  }}
                >
                  ✓
                </div>

                <div style={{ display: "inline-block", marginBottom: "8px" }}>
                  <span className="badge badge-success" style={{ fontSize: "0.75rem", padding: "3px 10px" }}>
                    Transaction Submitted
                  </span>
                </div>

                <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0 0 8px", color: "#FFFFFF" }}>
                  Payment Under Review!
                </h2>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "20px" }}>
                  Your UPI transaction has been queued for admin verification. The admin will verify your payment and activate your <strong>{planConfig.name}</strong> plan within <strong>6 hours</strong>.
                </p>

                <div
                  style={{
                    backgroundColor: "#1A1A1A",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-subtle)",
                    textAlign: "left",
                    marginBottom: "24px",
                    fontSize: "0.85rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Plan Requested:</span>
                    <strong style={{ color: planConfig.accentColor }}>{planConfig.name}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Amount Paid:</span>
                    <strong style={{ color: "var(--accent-primary)" }}>₹{payableAmount} INR</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Transaction ID / UTR:</span>
                    <strong style={{ color: "#FFFFFF", fontFamily: "monospace" }}>#{transactionId}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Turnaround SLA:</span>
                    <span style={{ color: "#10B981", fontWeight: 700 }}>Within 6 hours</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <Link
                    href="/dashboard"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                  >
                    View Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedPlanModal(null)}
                    className="btn btn-secondary"
                    style={{ padding: "10px 18px" }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* PAYMENT & QR SCAN STATE */
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span className="badge badge-yellow">
                    {planConfig.badge}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    UPI Payment Gateway
                  </span>
                </div>

                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 4px", color: "#FFFFFF" }}>
                  Get {planConfig.name} &bull; ₹{payableAmount}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: "0 0 16px" }}>
                  Scan the Google Pay QR code below with any UPI app, then submit your transaction ID for admin activation.
                </p>

                {/* QR CODE CARD */}
                <div
                  style={{
                    backgroundColor: "#181818",
                    padding: "20px 16px",
                    borderRadius: "16px",
                    border: "1px solid var(--border-default)",
                    textAlign: "center",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px", fontWeight: 700 }}>
                    Scan with GPay, PhonePe, Paytm, or Any UPI App
                  </div>

                  {/* QR Image with crisp white padding */}
                  <div
                    style={{
                      display: "inline-block",
                      backgroundColor: "#FFFFFF",
                      padding: "10px",
                      borderRadius: "14px",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                      marginBottom: "12px",
                    }}
                  >
                    <img
                      src="/payments/auramind-upi-qr.jpg"
                      alt="AuraMind Google Pay UPI QR Code"
                      style={{
                        width: "190px",
                        height: "190px",
                        display: "block",
                        borderRadius: "8px",
                        objectFit: "contain",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--accent-primary)" }}>
                      ₹{payableAmount}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      ({billingCycle === "annual" ? "Annual Plan" : "1 Month"})
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", flexWrap: "wrap", fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "#222222" }}>Google Pay</span>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "#222222" }}>PhonePe</span>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "#222222" }}>Paytm</span>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "#222222" }}>BHIM UPI</span>
                    <span style={{ padding: "2px 6px", borderRadius: "4px", backgroundColor: "#222222" }}>Cred</span>
                  </div>
                </div>

                {/* TRANSACTION SUBMISSION FORM */}
                <form onSubmit={handlePaySubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                      UPI Transaction ID / UTR Number <span style={{ color: "var(--accent-primary)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 431289456721 (12-digit UTR)"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#1A1A1A",
                        border: "1px solid var(--border-default)",
                        color: "#FFFFFF",
                        fontFamily: "monospace",
                        fontSize: "0.95rem",
                      }}
                    />
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      Copy the 12-digit UTR from your UPI payment success screen.
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "6px" }}>
                      Payer Name or Mobile (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ridham / 9876543210"
                      value={payerNote}
                      onChange={(e) => setPayerNote(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        backgroundColor: "#1A1A1A",
                        border: "1px solid var(--border-default)",
                        color: "#FFFFFF",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>

                  {/* 6-HOUR APPROVAL NOTICE */}
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 214, 0, 0.08)",
                      border: "1px solid rgba(255, 214, 0, 0.25)",
                      fontSize: "0.78rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "1rem", flexShrink: 0 }}>🛡️</span>
                    <div>
                      <strong>6-Hour Activation SLA:</strong> Admin reviews each payment and activates your plan within <strong>6 hours</strong>. Your dashboard limits will update automatically once verified.
                    </div>
                  </div>

                  {feedbackMessage && (
                    <div
                      className={`alert ${feedbackMessage.type === "success" ? "alert-success" : "alert-error"}`}
                      style={{ padding: "8px 12px", fontSize: "0.82rem", margin: 0 }}
                    >
                      {feedbackMessage.text}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    {!isAuthenticated ? (
                      <Link
                        href={`/login?redirect=/pricing?plan=${selectedPlanModal}`}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: "12px", fontWeight: 800, justifyContent: "center" }}
                      >
                        Log In to Submit Payment &rarr;
                      </Link>
                    ) : (
                      <button
                        type="submit"
                        disabled={isProcessingUpgrade}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: "12px", fontWeight: 800, justifyContent: "center" }}
                      >
                        {isProcessingUpgrade ? "Submitting..." : "Submit Transaction ID &rarr;"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedPlanModal(null)}
                      className="btn btn-secondary"
                      style={{ padding: "12px 16px" }}
                    >
                      Cancel
                    </button>
                  </div>

                  <div style={{ textAlign: "center", marginTop: "14px" }}>
                    <Link
                      href={`/checkout?plan=${planConfig.id}&cycle=${billingCycle}`}
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--accent-primary)",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Prefer a full order review? Open Dedicated Checkout Page &rarr;
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function PlanCard({
  plan,
  billingCycle,
  isCurrentPlan,
  onSelect,
  featured = false,
  diamondGlow = false,
}: {
  plan: any;
  billingCycle: BillingCycle;
  isCurrentPlan: boolean;
  onSelect: () => void;
  featured?: boolean;
  diamondGlow?: boolean;
}) {
  const price =
    billingCycle === "annual" ? plan.annualPriceMonthly : plan.monthlyPriceIntro;
  const regularPrice = plan.monthlyPriceRegular;

  return (
    <div
      className="card"
      style={{
        backgroundColor: "#111111",
        borderRadius: "20px",
        padding: "36px 28px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: featured
          ? "2px solid var(--accent-primary)"
          : diamondGlow
          ? "2px solid #38BDF8"
          : "1px solid var(--border-default)",
        boxShadow: featured
          ? "0 0 35px rgba(255, 214, 0, 0.15)"
          : diamondGlow
          ? "0 0 35px rgba(56, 189, 248, 0.15)"
          : "none",
        position: "relative",
      }}
    >
      {featured && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--accent-primary)",
            color: "#000000",
            fontSize: "0.75rem",
            fontWeight: 900,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "4px 16px",
            borderRadius: "9999px",
            boxShadow: "0 4px 12px rgba(255, 214, 0, 0.4)",
          }}
        >
          Most Popular
        </div>
      )}

      {diamondGlow && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#38BDF8",
            color: "#000000",
            fontSize: "0.75rem",
            fontWeight: 900,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "4px 16px",
            borderRadius: "9999px",
            boxShadow: "0 4px 12px rgba(56, 189, 248, 0.4)",
          }}
        >
          Ultimate AI Power
        </div>
      )}

      <div>
        {/* Tier Name & Tagline */}
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: plan.accentColor,
              marginBottom: "4px",
            }}
          >
            {plan.name}
          </div>
          <h3 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 6px", color: "#FFFFFF" }}>
            {plan.tagline}
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0, minHeight: "38px" }}>
            &ldquo;{plan.coreLevelPhilosophy}&rdquo;
          </p>
        </div>

        {/* Pricing Display */}
        <div style={{ padding: "18px 0", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "2.8rem", fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em" }}>
              ₹{price}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>/month</span>
            <span
              style={{
                textDecoration: "line-through",
                color: "var(--text-muted)",
                fontSize: "1rem",
                marginLeft: "auto",
              }}
            >
              ₹{regularPrice}
            </span>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Billed {billingCycle === "annual" ? "annually (discounted)" : "monthly"} &bull; Cancel anytime
          </div>
        </div>

        {/* Core Quotas Highlight */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              backgroundColor: "#161616",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border-default)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Goals</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: plan.accentColor }}>
              Up to {plan.maxGoals}
            </div>
          </div>
          <div
            style={{
              backgroundColor: "#161616",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border-default)",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Friends</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: plan.accentColor }}>
              Up to {plan.maxFriends}
            </div>
          </div>
        </div>

        {/* Bullet Highlights */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "12px", letterSpacing: "0.04em" }}>
            Included in {plan.name}:
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
            {plan.keyHighlights.map((highlight: string, i: number) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.45,
                }}
              >
                <span style={{ color: plan.accentColor, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA Button */}
      <div>
        <button
          type="button"
          onClick={onSelect}
          className={featured ? "btn btn-primary" : "btn btn-secondary"}
          style={{
            width: "100%",
            padding: "12px 20px",
            fontWeight: 800,
            fontSize: "0.95rem",
            justifyContent: "center",
            boxShadow: featured ? "0 4px 18px rgba(255, 214, 0, 0.25)" : "none",
          }}
        >
          {isCurrentPlan ? "✓ Current Active Plan" : `Choose ${plan.name} &rarr;`}
        </button>
      </div>
    </div>
  );
}

function PlanDeepDiveSection({ plan }: { plan: any }) {
  return (
    <div
      style={{
        backgroundColor: "#111111",
        borderRadius: "18px",
        border: "1px solid var(--border-default)",
        padding: "36px 32px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 800,
            padding: "3px 10px",
            borderRadius: "6px",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            color: plan.accentColor,
          }}
        >
          {plan.name.toUpperCase()}
        </span>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0 }}>
          {plan.tagline} &bull; ₹{plan.monthlyPriceIntro}/mo
        </h3>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
          marginTop: "24px",
        }}
      >
        {plan.sections.map((section: any, idx: number) => (
          <div key={idx} style={{ backgroundColor: "#161616", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "0 0 12px", color: "#FFFFFF" }}>
              {section.title}
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {section.items.map((item: string, itemIdx: number) => (
                <li
                  key={itemIdx}
                  style={{
                    fontSize: "0.83rem",
                    color: item.startsWith("Important:") ? "#EF4444" : "var(--text-secondary)",
                    lineHeight: 1.45,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: item.startsWith("Important:") ? "#EF4444" : "var(--accent-primary)", flexShrink: 0 }}>
                    &bull;
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCellContent(value: any) {
  if (value === true) {
    return <span style={{ color: "#10B981", fontWeight: 800, fontSize: "1.1rem" }}>✓</span>;
  }
  if (value === false) {
    return <span style={{ color: "#6B7280", fontWeight: 700, fontSize: "0.95rem" }}>—</span>;
  }
  return <span style={{ fontWeight: 700, color: "#FFFFFF" }}>{value}</span>;
}
