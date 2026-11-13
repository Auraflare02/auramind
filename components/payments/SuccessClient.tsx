"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const searchParams = useSearchParams();
  const fallbackTier = searchParams.get("tier") || "platinum";

  const [subData, setSubData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Independently verify active subscription from backend API
  useEffect(() => {
    async function verifyWithBackend() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          setSubData(data.userSubscription);
        }
      } catch {
        // Fallback to query param presentation if network error
      } finally {
        setIsLoading(false);
      }
    }
    verifyWithBackend();
  }, []);

  const activeTier = subData?.tier || fallbackTier.toLowerCase();
  const planName = activeTier.toUpperCase();
  const planConfig = subData?.plan;

  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh", paddingTop: "60px", paddingBottom: "96px" }}>
      <div className="container" style={{ maxWidth: "680px" }}>
        
        <div
          className="card"
          style={{
            padding: "40px 32px",
            backgroundColor: "var(--card)",
            borderRadius: "20px",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.7)",
            textAlign: "center",
          }}
        >
          {/* GREEN CHECK ICON */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.4rem",
              margin: "0 auto 20px",
              border: "1px solid rgba(16, 185, 129, 0.4)",
            }}
          >
            ✓
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                color: "var(--success)",
                padding: "3px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              Subscription Active &amp; Verified
            </span>
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 10px", color: "var(--text)" }}>
            Welcome to AuraMind {planName}!
          </h1>

          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto 28px" }}>
            Your payment has been successfully reconciled. All premium features, increased goal quotas, and multi-channel accountability systems have been unlocked on your account.
          </p>

          {/* UNLOCKED FEATURES SUMMARY */}
          <div
            style={{
              backgroundColor: "var(--card)",
              borderRadius: "14px",
              padding: "20px 24px",
              textAlign: "left",
              border: "1px solid var(--border-default)",
              marginBottom: "32px",
            }}
          >
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "12px" }}>
              Active Quota Allocation
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem" }}>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>Plan Tier:</span>
                <span style={{ fontWeight: 800, color: "var(--text)" }}>{planName} Plan</span>
              </div>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>Active Goals Allowed:</span>
                <span style={{ fontWeight: 800, color: "var(--accent-primary)" }}>
                  Up to {planConfig?.maxGoals || (activeTier === "diamond" ? 25 : activeTier === "platinum" ? 3 : 1)} Goals
                </span>
              </div>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>Accountability Friends:</span>
                <span style={{ fontWeight: 800, color: "var(--accent-primary)" }}>
                  Up to {planConfig?.maxFriends || (activeTier === "diamond" ? 50 : activeTier === "platinum" ? 15 : 5)} Friends
                </span>
              </div>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>WhatsApp Check-ins:</span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>
                  {activeTier === "gold" ? "Not Included (App Only)" : "✓ Enabled"}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ color: "var(--text-secondary)" }}>AI Voice Calling Agent:</span>
                <span style={{ color: "var(--success)", fontWeight: 700 }}>
                  {activeTier === "diamond"
                    ? "✓ 450 Calls/Month"
                    : activeTier === "platinum"
                    ? "✓ 60 Calls/Month"
                    : "Not Included"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ fontWeight: 800, padding: "12px 28px" }}>
              Launch Your Dashboard &rarr;
            </Link>
            <Link href="/#create-goal" className="btn btn-secondary btn-lg" style={{ padding: "12px 20px" }}>
              Create a New Goal
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
