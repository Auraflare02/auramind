"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";
import { SubscriptionTier, BillingCycle } from "@/lib/subscription/types";

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial plan from query param or default to Platinum
  const planParam = searchParams.get("plan") as SubscriptionTier | null;
  const cycleParam = searchParams.get("cycle") as BillingCycle | null;

  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    planParam && ["gold", "platinum", "diamond"].includes(planParam) ? planParam : "platinum"
  );
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    cycleParam === "annual" ? "annual" : "monthly"
  );

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
        // Continue in guest mode if profile fetch fails
      } finally {
        setIsLoadingAuth(false);
      }
    }
    loadUser();
  }, []);

  const plan = SUBSCRIPTION_PLANS[selectedTier] || SUBSCRIPTION_PLANS.platinum;

  const payableAmount =
    billingCycle === "annual"
      ? plan.annualPriceMonthly * 12
      : plan.monthlyPriceRegular;

  const monthlyEquivalent =
    billingCycle === "annual" ? plan.annualPriceMonthly : plan.monthlyPriceRegular;

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
          tier: selectedTier,
          billingCycle,
          amount: payableAmount,
          transactionId: cleanTx,
          notes: senderNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit payment proof.");
      }

      // Navigate to /payment/pending status page
      const reqId = data.request?.id || `pay_${Date.now()}`;
      router.push(
        `/payment/pending?id=${encodeURIComponent(reqId)}&tier=${encodeURIComponent(selectedTier)}&amount=${encodeURIComponent(payableAmount)}&tx=${encodeURIComponent(cleanTx)}`
      );
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again or email ridhx02@gmail.com.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#080808", color: "#FFFFFF", minHeight: "100vh", paddingTop: "40px", paddingBottom: "96px" }}>
      <div className="container" style={{ maxWidth: "1140px" }}>
        
        {/* TOP BREADCRUMB & HEADER */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "12px" }}>
            <Link href="/" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href="/pricing" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Pricing</Link>
            <span>/</span>
            <span style={{ color: "var(--accent-primary)" }}>Checkout</span>
          </div>

          <div className="flex-between" style={{ flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)", fontWeight: 800, margin: 0, color: "#FFFFFF" }}>
                Secure Subscription Checkout
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: "0.95rem", color: "var(--text-secondary)" }}>
                Upgrade your AuraMind account to activate advanced AI accountability, WhatsApp check-ins, and calling agents.
              </p>
            </div>

            {/* BILLING CYCLE SELECTOR */}
            <div
              style={{
                display: "inline-flex",
                backgroundColor: "#161616",
                padding: "4px",
                borderRadius: "9999px",
                border: "1px solid var(--border-default)",
              }}
            >
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: billingCycle === "monthly" ? "var(--accent-primary)" : "transparent",
                  color: billingCycle === "monthly" ? "#000000" : "var(--text-secondary)",
                  transition: "all var(--transition-fast)",
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                style={{
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: billingCycle === "annual" ? "var(--accent-primary)" : "transparent",
                  color: billingCycle === "annual" ? "#000000" : "var(--text-secondary)",
                  transition: "all var(--transition-fast)",
                }}
              >
                Annual <span style={{ color: billingCycle === "annual" ? "#000000" : "#10B981", fontSize: "0.74rem" }}>(Save 30%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* AUTH CHECK NOTIFICATION */}
        {!isLoadingAuth && !userProfile && (
          <div
            className="alert"
            style={{
              marginBottom: "24px",
              backgroundColor: "rgba(255, 214, 0, 0.08)",
              border: "1px solid rgba(255, 214, 0, 0.3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <strong style={{ color: "var(--accent-primary)" }}>Not signed in?</strong>
              <span style={{ marginLeft: "6px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Sign in to your account first so your subscription activates seamlessly upon admin verification.
              </span>
            </div>
            <Link href="/login?next=/checkout" className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
              Sign In to Continue &rarr;
            </Link>
          </div>
        )}

        {/* 2-COLUMN CHECKOUT GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "28px",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN: PLAN PICKER & PAYMENT FORM */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* 1. PLAN PICKER CARDS */}
            <div className="card" style={{ padding: "24px", backgroundColor: "var(--bg-card)", borderRadius: "16px" }}>
              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--text-muted)", marginBottom: "14px" }}>
                Step 1: Choose Your Plan
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                {(["gold", "platinum", "diamond"] as SubscriptionTier[]).map((t) => {
                  const p = SUBSCRIPTION_PLANS[t];
                  const isSelected = selectedTier === t;
                  const price = billingCycle === "annual" ? p.annualPriceMonthly : p.monthlyPriceRegular;

                  return (
                    <div
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor: isSelected ? "#1C1C1C" : "var(--bg-elevated)",
                        border: isSelected
                          ? `2px solid ${t === "diamond" ? "#38BDF8" : "var(--accent-primary)"}`
                          : "1px solid var(--border-default)",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: "6px" }}>
                        <span style={{ fontWeight: 800, fontSize: "1rem", color: "#FFFFFF" }}>{p.name}</span>
                        {p.popular && (
                          <span style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "var(--accent-primary)", color: "#000", padding: "1px 6px", borderRadius: "9999px" }}>
                            Popular
                          </span>
                        )}
                        {t === "diamond" && (
                          <span style={{ fontSize: "0.65rem", fontWeight: 800, backgroundColor: "#38BDF8", color: "#000", padding: "1px 6px", borderRadius: "9999px" }}>
                            Pro Max
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "1.4rem", fontWeight: 900, color: t === "diamond" ? "#38BDF8" : "var(--accent-primary)" }}>
                        ₹{price}
                        <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>/mo</span>
                      </div>

                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "8px", lineHeight: 1.4 }}>
                        {t === "gold" && "1 Goal • 5 Friends • App Alerts"}
                        {t === "platinum" && "3 Goals • 15 Friends • WhatsApp • 60 Calls"}
                        {t === "diamond" && "25 Goals • 50 Friends • WhatsApp • 450 Calls"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. PAYMENT METHOD: OFFICIAL GOOGLE PAY UPI QR SCAN & PAY */}
            <div className="card" style={{ padding: "24px", backgroundColor: "var(--bg-card)", borderRadius: "16px" }}>
              <div style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--text-muted)", marginBottom: "14px" }}>
                Step 2: Scan &amp; Pay via UPI
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "20px",
                  backgroundColor: "#0A0A0A",
                  borderRadius: "14px",
                  border: "1px solid var(--border-default)",
                  marginBottom: "20px",
                }}
              >
                {/* QR CODE CONTAINER */}
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: "16px",
                    borderRadius: "16px",
                    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6)",
                    marginBottom: "16px",
                  }}
                >
                  <img
                    src="/payments/auramind-upi-qr.jpg"
                    alt="AuraMind Google Pay UPI QR Code"
                    style={{
                      width: "220px",
                      height: "220px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>

                {/* EXACT PAYABLE AMOUNT BADGE */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    Exact Payable Amount
                  </div>
                  <div
                    style={{
                      fontSize: "2.2rem",
                      fontWeight: 900,
                      color: selectedTier === "diamond" ? "#38BDF8" : "var(--accent-primary)",
                      letterSpacing: "-0.02em",
                      margin: "2px 0",
                    }}
                  >
                    ₹{payableAmount}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Scan with Google Pay, PhonePe, Paytm, BHIM, or any bank UPI app
                  </div>
                </div>
              </div>

              {/* PAYMENT INSTRUCTIONS */}
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
                <strong style={{ color: "#FFFFFF" }}>How to complete your payment:</strong>
                <ol style={{ paddingLeft: "20px", margin: "6px 0 0", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Open your preferred UPI app on your smartphone.</li>
                  <li>Scan the Google Pay UPI QR code above.</li>
                  <li>Enter the exact amount: <strong style={{ color: "#FFFFFF" }}>₹{payableAmount}</strong> and confirm the transfer.</li>
                  <li>Copy your <strong>12-digit UPI Transaction ID / UTR</strong> number from your payment confirmation screen and paste it below.</li>
                </ol>
              </div>

              {/* 3. SUBMIT TRANSACTION ID FORM */}
              <form onSubmit={handleSubmitPayment}>
                <div style={{ marginBottom: "16px" }}>
                  <label htmlFor="txId" style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#FFFFFF", marginBottom: "6px" }}>
                    12-Digit UPI Transaction ID / UTR <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    id="txId"
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
                    placeholder="e.g. 431289047123"
                    className="form-input"
                    maxLength={32}
                    style={{
                      fontFamily: "monospace",
                      fontSize: "1rem",
                      letterSpacing: "0.08em",
                      fontWeight: 700,
                    }}
                  />
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Found under payment details as &ldquo;UPI Ref No.&rdquo; or &ldquo;UTR / Transaction ID&rdquo;.
                  </div>
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label htmlFor="notes" style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Optional Sender Name or UPI ID Note
                  </label>
                  <input
                    id="notes"
                    type="text"
                    value={senderNotes}
                    onChange={(e) => setSenderNotes(e.target.value)}
                    placeholder="e.g. Paid from HDFC UPI / Alex"
                    className="form-input"
                    style={{ fontSize: "0.875rem" }}
                  />
                </div>

                {submitError && (
                  <div className="alert alert-error" style={{ marginBottom: "16px", fontSize: "0.85rem" }}>
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !transactionId.trim()}
                  className="btn btn-primary btn-lg"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "1rem",
                    backgroundColor: selectedTier === "diamond" ? "#38BDF8" : "var(--accent-primary)",
                    borderColor: selectedTier === "diamond" ? "#38BDF8" : "var(--accent-primary)",
                    color: "#000000",
                  }}
                >
                  {isSubmitting ? "Submitting Payment Proof..." : `Submit Proof & Activate ${plan.name} \u2192`}
                </button>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    marginTop: "12px",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <span>🛡️ 6-Hour Activation Guarantee</span>
                  <span>&bull;</span>
                  <span>Direct Bank Reconciliation</span>
                  <span>&bull;</span>
                  <Link href="/refund-policy" style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
                    Refund SLA
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY & CONSUMER GUARANTEES */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* ORDER SUMMARY CARD */}
            <div className="card" style={{ padding: "24px", backgroundColor: "var(--bg-card)", borderRadius: "16px" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFFFFF", margin: "0 0 16px" }}>
                Order Summary
              </h2>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "14px", borderBottom: "1px solid var(--border-subtle)", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#FFFFFF" }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {billingCycle === "annual" ? "12-Month Commitment" : "1-Month Access"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#FFFFFF" }}>
                    ₹{payableAmount}
                  </div>
                  {billingCycle === "annual" && (
                    <div style={{ fontSize: "0.72rem", color: "#10B981" }}>
                      ₹{monthlyEquivalent}/mo equivalent
                    </div>
                  )}
                </div>
              </div>

              {/* LINE ITEMS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Subtotal</span>
                  <span>₹{payableAmount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Platform &amp; Gateway Fees</span>
                  <span style={{ color: "#10B981" }}>₹0 (Covered by AuraMind)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>GST / Indian Taxes</span>
                  <span>Inclusive</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid var(--border-default)", marginBottom: "20px" }}>
                <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#FFFFFF" }}>Total Payable</span>
                <span style={{ fontWeight: 900, fontSize: "1.45rem", color: selectedTier === "diamond" ? "#38BDF8" : "var(--accent-primary)" }}>
                  ₹{payableAmount}
                </span>
              </div>

              {/* INCLUDED IN YOUR PLAN */}
              <div style={{ backgroundColor: "#111111", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, color: "var(--text-muted)", marginBottom: "10px" }}>
                  Included with {plan.name}:
                </div>
                <ul style={{ paddingLeft: "18px", margin: 0, display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  <li><strong>Up to {plan.maxGoals} active goal{plan.maxGoals > 1 ? "s" : ""}</strong> simultaneously</li>
                  <li><strong>Up to {plan.maxFriends} friends</strong> in your private circle</li>
                  <li>
                    {plan.whatsAppCheckins
                      ? "Hourly WhatsApp check-ins & reminders"
                      : "Hourly in-app notifications only (No WhatsApp)"}
                  </li>
                  <li>
                    {plan.aiCallsPerMonth > 0
                      ? `Up to ${plan.aiCallsPerMonth} conversational AI voice calls/month`
                      : "No AI voice calling"}
                  </li>
                  <li>
                    {plan.googleCalendar === "full"
                      ? "Full automated 2-way Google Calendar sync"
                      : plan.googleCalendar === "basic"
                      ? "Basic Google Calendar schedule sync"
                      : "No Google Calendar sync"}
                  </li>
                  <li>Focus timer with Pomodoro tracking &amp; XP rank</li>
                  <li>Daily &amp; weekly productivity reports</li>
                </ul>
              </div>
            </div>

            {/* TRUST & GUARANTEES */}
            <div className="card" style={{ padding: "20px", backgroundColor: "var(--bg-card)", borderRadius: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <span style={{ fontSize: "1.1rem" }}>⚡</span>
                  <div>
                    <strong style={{ color: "#FFFFFF" }}>6-Hour Activation Turnaround</strong>
                    <div>Bank reconciliation confirms your payment and activates tier quotas within 6 hours.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <span style={{ fontSize: "1.1rem" }}>🔒</span>
                  <div>
                    <strong style={{ color: "#FFFFFF" }}>Zero-Compromise Security</strong>
                    <div>Direct bank-to-bank UPI payment without exposing credit card details or bank logins.</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <span style={{ fontSize: "1.1rem" }}>📄</span>
                  <div>
                    <strong style={{ color: "#FFFFFF" }}>Transparent Cancellation &amp; Refunds</strong>
                    <div>Cancel anytime in Settings. Full refund if activation SLA exceeds 24 hours.</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", textAlign: "center", fontSize: "0.78rem" }}>
                Need billing help? Contact <a href="mailto:ridhx02@gmail.com" style={{ color: "var(--accent-primary)" }}>ridhx02@gmail.com</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
