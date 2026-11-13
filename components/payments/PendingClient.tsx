"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function PendingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reqId = searchParams.get("id") || "";
  const tier = (searchParams.get("tier") || "platinum").toUpperCase();
  const amount = searchParams.get("amount") || "699";
  const tx = searchParams.get("tx") || "";

  const [copiedTx, setCopiedTx] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<"pending" | "approved" | "rejected">("pending");

  // Check live status every 15 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;

    async function checkStatus() {
      try {
        const res = await fetch("/api/payments/status");
        if (res.ok) {
          const data = await res.json();
          const match = data.requests?.find((r: any) => r.id === reqId || r.transactionId === tx);
          if (match) {
            if (match.status === "approved") {
              setCurrentStatus("approved");
              router.push(`/payment/success?id=${encodeURIComponent(match.id)}&tier=${encodeURIComponent(match.tier)}`);
            } else if (match.status === "rejected") {
              setCurrentStatus("rejected");
              router.push(`/payment/failed?id=${encodeURIComponent(match.id)}&reason=${encodeURIComponent(match.notes || "")}`);
            }
          }
        }
      } catch {
        // Silently continue polling
      }
    }

    checkStatus();
    interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [reqId, tx, router]);

  const copyTx = () => {
    if (tx) {
      navigator.clipboard.writeText(tx);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh", paddingTop: "60px", paddingBottom: "96px" }}>
      <div className="container" style={{ maxWidth: "680px" }}>
        
        {/* CARD CONTAINER */}
        <div
          className="card"
          style={{
            padding: "36px 32px",
            backgroundColor: "var(--card)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 214, 0, 0.35)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.7)",
            textAlign: "center",
          }}
        >
          {/* ICON & BADGE */}
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 214, 0, 0.12)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              margin: "0 auto 20px",
              border: "1px solid rgba(255, 214, 0, 0.3)",
            }}
          >
            ⏳
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                backgroundColor: "rgba(255, 214, 0, 0.15)",
                color: "var(--accent-primary)",
                padding: "3px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(255, 214, 0, 0.3)",
              }}
            >
              Verification Underway
            </span>
          </div>

          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, margin: "0 0 10px", color: "var(--text)" }}>
            Payment Proof Received!
          </h1>

          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto 28px" }}>
            Your 12-digit UPI reference has been queued for bank reconciliation. Our administrative team will verify the incoming credit and activate your <strong style={{ color: "var(--accent-primary)" }}>{tier} PLAN</strong> within our 6-hour guarantee.
          </p>

          {/* ORDER RECEIPT DETAILS */}
          <div
            style={{
              backgroundColor: "var(--card)",
              borderRadius: "14px",
              padding: "20px 24px",
              textAlign: "left",
              border: "1px solid var(--border-default)",
              marginBottom: "28px",
            }}
          >
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "12px" }}>
              Transaction Summary
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>Plan Requested:</span>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>{tier} Plan</span>
              </div>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>Payable Amount:</span>
                <span style={{ fontWeight: 800, color: "var(--accent-primary)" }}>₹{amount}</span>
              </div>
              {tx && (
                <div className="flex-between" style={{ alignItems: "center" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Submitted UTR / Tx ID:</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text)" }}>{tx}</span>
                    <button
                      type="button"
                      onClick={copyTx}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                    >
                      {copiedTx ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>Status:</span>
                <span style={{ color: "var(--accent-primary)", fontWeight: 700 }}>Pending Verification</span>
              </div>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>Maximum SLA:</span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>Within 6 Hours</span>
              </div>
            </div>
          </div>

          {/* NEXT STEPS GUIDE */}
          <div style={{ textAlign: "left", marginBottom: "32px", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text)" }}>What happens next?</strong>
            <ul style={{ paddingLeft: "20px", margin: "6px 0 0", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>You can continue using your account normally right now.</li>
              <li>Once verified, your tier privileges (extra goals, WhatsApp prompts, AI voice calls) unlock automatically.</li>
              <li>This page checks verification status live. You do not need to refresh.</li>
            </ul>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ fontWeight: 800, padding: "10px 24px" }}>
              Go to Your Dashboard &rarr;
            </Link>
            <Link href="/pricing" className="btn btn-secondary btn-lg" style={{ padding: "10px 20px" }}>
              View Pricing Details
            </Link>
          </div>

          <div style={{ marginTop: "24px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Questions or urgent verification? Email <a href="mailto:ridhx02@gmail.com" style={{ color: "var(--accent-primary)" }}>ridhx02@gmail.com</a>
          </div>
        </div>

      </div>
    </div>
  );
}
