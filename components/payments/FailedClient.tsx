"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function FailedClient() {
  const searchParams = useSearchParams();
  const reqId = searchParams.get("id") || "";
  const reason = searchParams.get("reason") || "The submitted UTR number could not be matched against incoming bank credits.";

  return (
    <div style={{ backgroundColor: "var(--bg)", color: "var(--text)", minHeight: "100vh", paddingTop: "60px", paddingBottom: "96px" }}>
      <div className="container" style={{ maxWidth: "680px" }}>
        
        <div
          className="card"
          style={{
            padding: "40px 32px",
            backgroundColor: "var(--card)",
            borderRadius: "20px",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.7)",
            textAlign: "center",
          }}
        >
          {/* RED CROSS ICON */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "var(--error)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.4rem",
              margin: "0 auto 20px",
              border: "1px solid rgba(239, 68, 68, 0.4)",
            }}
          >
            ✕
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "var(--error)",
                padding: "3px 12px",
                borderRadius: "9999px",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}
            >
              Verification Unsuccessful
            </span>
          </div>

          <h1 style={{ fontSize: "1.9rem", fontWeight: 800, margin: "0 0 10px", color: "var(--text)" }}>
            Payment Could Not Be Verified
          </h1>

          <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "520px", margin: "0 auto 24px" }}>
            Our reconciliation team was unable to confirm the transaction reference with our receiving bank statement.
          </p>

          {/* REASON BOX */}
          <div
            style={{
              backgroundColor: "var(--card)",
              borderRadius: "14px",
              padding: "20px 24px",
              textAlign: "left",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              marginBottom: "28px",
            }}
          >
            <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700, marginBottom: "8px" }}>
              Reported Reason
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5 }}>
              {reason}
            </p>
            {reqId && (
              <div style={{ marginTop: "10px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Reference ID: <span style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{reqId}</span>
              </div>
            )}
          </div>

          {/* NEXT STEPS */}
          <div style={{ textAlign: "left", marginBottom: "32px", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text)" }}>Common reasons for verification failure:</strong>
            <ul style={{ paddingLeft: "20px", margin: "6px 0 0", display: "flex", flexDirection: "column", gap: "4px" }}>
              <li>Typo in the 12-digit UPI UTR number entered.</li>
              <li>Bank transfer is still in &ldquo;Pending&rdquo; status on your UPI app.</li>
              <li>Amount transferred was different from the exact plan fee.</li>
            </ul>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/checkout" className="btn btn-primary btn-lg" style={{ fontWeight: 800, padding: "10px 24px" }}>
              Retry Checkout &rarr;
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg" style={{ padding: "10px 20px" }}>
              Return to Dashboard
            </Link>
          </div>

          <div style={{ marginTop: "24px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Were you debited? Send your screenshot and UTR to <a href="mailto:ridhx02@gmail.com" style={{ color: "var(--accent-primary)" }}>ridhx02@gmail.com</a> for manual manual review.
          </div>
        </div>

      </div>
    </div>
  );
}
