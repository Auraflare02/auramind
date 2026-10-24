"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SetNewPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDone, setIsDone] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage("");

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password. Your reset link may have expired.");
      }

      setIsDone(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update password. Your reset link may have expired.");
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
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <h1
            style={{
              fontSize: "1.65rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: "6px",
              color: "var(--text-primary)",
            }}
          >
            Create New Password
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
            Enter your new secure password below.
          </p>
        </div>

        {isDone ? (
          <div className="surface-accent" style={{ padding: "24px", textAlign: "center", borderRadius: "12px" }}>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "8px", color: "var(--success)" }}>Password Updated!</h2>
            <p style={{ fontSize: "0.875rem", marginBottom: "16px", color: "var(--text-secondary)" }}>
              Your password has been changed successfully. Redirecting you to your dashboard...
            </p>
            <Link href="/dashboard" className="btn btn-primary" style={{ width: "100%" }}>
              Enter Dashboard Now
            </Link>
          </div>
        ) : (
          <>
            {errorMessage && (
              <div className="alert alert-error" style={{ marginBottom: "20px", fontSize: "0.85rem" }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label className="form-label" htmlFor="new-password">
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="At least 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    style={{
                      height: "44px",
                      paddingRight: "44px",
                      borderRadius: "8px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: "6px",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "22px" }}>
                <label className="form-label" htmlFor="confirm-new-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                }}
              >
                {isLoading ? "Saving Password..." : "Update Password & Continue"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
