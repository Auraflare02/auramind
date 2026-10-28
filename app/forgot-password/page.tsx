"use client";

import { useState } from "react";
import Link from "next/link";
import { AuraMindLogo } from "@/components/AuraMindBrand";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 140px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "36px 32px",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border-default)",
          borderRadius: "16px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <AuraMindLogo height={34} compactOnMobile={false} />

          <h1
            style={{
              fontSize: "1.65rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: "6px",
              color: "var(--text-primary)",
            }}
          >
            Reset Password
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
            Enter your email and we&rsquo;ll send you a secure link to reset your password.
          </p>
        </div>

        {isSubmitted ? (
          <div
            className="surface-accent"
            style={{
              padding: "24px",
              textAlign: "center",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-muted)",
                color: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Reset Link Dispatched</h2>
            <p style={{ fontSize: "0.875rem", marginBottom: "20px", color: "var(--text-secondary)" }}>
              If an account is associated with <strong style={{ color: "var(--text-primary)" }}>{email}</strong>, you will receive an email shortly with instructions to reset your password.
            </p>
            <Link href="/login" className="btn btn-secondary" style={{ width: "100%" }}>
              Back to Log In
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="alert alert-error" style={{ marginBottom: "20px", fontSize: "0.85rem" }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleResetRequest}>
              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label" htmlFor="reset-email">
                  Account Email Address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="alex@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{
                    height: "44px",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  height: "44px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                {isLoading ? "Dispatching Link..." : "Send Reset Link"}
              </button>

              <div style={{ textAlign: "center" }}>
                <Link
                  href="/login"
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    textDecoration: "none",
                  }}
                >
                  &larr; Back to Log In
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
