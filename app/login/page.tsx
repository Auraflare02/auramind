"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuraMindLogo } from "@/components/AuraMindBrand";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "US / Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+65", label: "Singapore (+65)" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication Method Switcher
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

  // Email / Password State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Mobile / OTP State
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // General Status
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const nextPath = searchParams.get("next") || "/dashboard";

  // Check URL parameters for errors or messages
  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");
    if (errorParam) setErrorMessage(decodeURIComponent(errorParam));
    if (messageParam) setSuccessMessage(decodeURIComponent(messageParam));
  }, [searchParams]);

  // Resend Countdown Timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Format full mobile number
  const getFullPhone = () => {
    const raw = phoneNumber.trim().replace(/[\s\-\(\)]/g, "");
    if (raw.startsWith("+")) return raw;
    return `${countryCode}${raw}`;
  };

  // 1. Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOtpSending) return;

    setErrorMessage("");
    setSuccessMessage("");

    const fullPhone = getFullPhone();
    if (!phoneNumber.trim() || fullPhone.length < 9) {
      setErrorMessage("Please enter a valid mobile number.");
      return;
    }

    setIsOtpSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, isSignup: false }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setNormalizedPhone(data.phone || fullPhone);
      setOtpSent(true);
      setResendCountdown(30);
      setSuccessMessage(data.message || `Verification code sent to ${data.phone || fullPhone}.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send OTP. Please check your mobile number.");
    } finally {
      setIsOtpSending(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOtpVerifying) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setErrorMessage("Please enter the verification code received via SMS.");
      return;
    }

    setIsOtpVerifying(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: normalizedPhone || getFullPhone(),
          token: otpCode.trim(),
          isSignup: false,
          next: nextPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid or expired verification code.");
      }

      const safeDestination = data.destination || (nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard");
      router.push(safeDestination);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify code.");
    } finally {
      setIsOtpVerifying(false);
    }
  };

  // 3. Email / Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading) return;

    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      const safeDestination = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
      router.push(safeDestination);
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Google OAuth Login
  const handleGoogleLogin = () => {
    if (isLoading || isGoogleLoading || isOtpSending || isOtpVerifying) return;
    setErrorMessage("");
    setIsGoogleLoading(true);
    window.location.href = `/api/auth/google?next=${encodeURIComponent(nextPath)}`;
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
        {/* BRANDMARK */}
        <div style={{ textAlign: "center", marginBottom: "22px" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "14px" }}>
            <AuraMindLogo height={34} compactOnMobile={false} />
          </div>

          <h1
            style={{
              fontSize: "1.65rem",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              marginBottom: "6px",
              color: "var(--text-primary)",
            }}
          >
            Welcome Back
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
            Continue your deliberate practice journey.
          </p>
        </div>

        {/* ALERTS */}
        {errorMessage && (
          <div
            className="alert alert-error"
            style={{
              marginBottom: "18px",
              fontSize: "0.85rem",
              padding: "10px 14px",
              borderRadius: "8px",
            }}
          >
            <span style={{ fontWeight: 700 }}>Notice:</span> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            className="alert alert-success"
            style={{
              marginBottom: "18px",
              fontSize: "0.85rem",
              padding: "10px 14px",
              borderRadius: "8px",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* AUTH METHOD SELECTOR TABS */}
        <div
          style={{
            display: "flex",
            backgroundColor: "var(--bg-secondary)",
            padding: "4px",
            borderRadius: "10px",
            marginBottom: "20px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "0.85rem",
              fontWeight: 700,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              backgroundColor: authMethod === "phone" ? "var(--bg-card)" : "transparent",
              color: authMethod === "phone" ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: authMethod === "phone" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none",
            }}
          >
            Mobile &amp; OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("email");
              setErrorMessage("");
              setSuccessMessage("");
            }}
            style={{
              flex: 1,
              padding: "8px 12px",
              fontSize: "0.85rem",
              fontWeight: 700,
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              backgroundColor: authMethod === "email" ? "var(--bg-card)" : "transparent",
              color: authMethod === "email" ? "var(--accent-primary)" : "var(--text-secondary)",
              boxShadow: authMethod === "email" ? "0 2px 8px rgba(0, 0, 0, 0.2)" : "none",
            }}
          >
            Email &amp; Password
          </button>
        </div>

        {/* METHOD 1: MOBILE NUMBER & OTP */}
        {authMethod === "phone" ? (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div className="form-group" style={{ marginBottom: "18px" }}>
                  <label className="form-label" htmlFor="login-phone">
                    Mobile Number
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="form-input"
                      style={{
                        width: "120px",
                        height: "44px",
                        borderRadius: "8px",
                        padding: "0 8px",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    <input
                      id="login-phone"
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="form-input"
                      style={{
                        flex: 1,
                        height: "44px",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted" style={{ marginTop: "6px" }}>
                    We&rsquo;ll send a 6-digit one-time verification code via SMS.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOtpSending}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    height: "44px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    borderRadius: "8px",
                  }}
                >
                  {isOtpSending ? "Sending OTP..." : "Send Verification Code \u2192"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    marginBottom: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Code sent to</div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                      {normalizedPhone}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                      setErrorMessage("");
                      setSuccessMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-primary)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Change
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: "18px" }}>
                  <label className="form-label" htmlFor="login-otp">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={8}
                    required
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="form-input"
                    autoFocus
                    style={{
                      height: "48px",
                      borderRadius: "8px",
                      textAlign: "center",
                      fontSize: "1.4rem",
                      letterSpacing: "0.25em",
                      fontWeight: 700,
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "8px",
                      fontSize: "0.8rem",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)" }}>Didn&rsquo;t receive code?</span>
                    {resendCountdown > 0 ? (
                      <span style={{ color: "var(--text-muted)" }}>Resend in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isOtpSending}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-primary)",
                          cursor: "pointer",
                          fontWeight: 700,
                          padding: 0,
                        }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOtpVerifying}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    height: "44px",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    borderRadius: "8px",
                  }}
                >
                  {isOtpVerifying ? "Verifying..." : "Verify & Sign In"}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* METHOD 2: EMAIL & PASSWORD */
          <form onSubmit={handleEmailLogin}>
            <div className="form-group" style={{ marginBottom: "16px" }}>
              <label className="form-label" htmlFor="login-email">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
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

            <div className="form-group" style={{ marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--accent-primary)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "22px" }}>
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: "var(--accent-primary)",
                  cursor: "pointer",
                  width: "16px",
                  height: "16px",
                }}
              />
              <label
                htmlFor="remember-me"
                style={{
                  fontSize: "0.825rem",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                Remember this session
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="btn btn-primary"
              style={{
                width: "100%",
                height: "44px",
                fontSize: "0.95rem",
                fontWeight: 700,
                borderRadius: "8px",
              }}
            >
              {isLoading ? "Signing in..." : "Log In with Email"}
            </button>
          </form>
        )}

        {/* DIVIDER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-default)" }} />
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "var(--text-muted)",
              textTransform: "uppercase",
            }}
          >
            OR CONTINUE WITH
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-default)" }} />
        </div>

        {/* GOOGLE OAUTH BUTTON */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading || isOtpSending || isOtpVerifying}
          className="btn btn-secondary"
          style={{
            width: "100%",
            height: "44px",
            fontSize: "0.9rem",
            fontWeight: 600,
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-default)",
          }}
        >
          {/* Official Google G Logo */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
        </button>

        {/* GOOGLE OAUTH LEGAL NOTICE */}
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: "10px",
            marginBottom: "0",
            lineHeight: "1.4",
          }}
        >
          By continuing, you access AuraMind under our{" "}
          <Link href="/terms" target="_blank" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href="/privacy-policy" target="_blank" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>
            Privacy Policy
          </Link>.
        </p>

        {/* FOOTER SWITCH */}
        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem" }}>
          <span style={{ color: "var(--text-secondary)" }}>Don&rsquo;t have an account? </span>
          <Link
            href={`/signup${nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
            style={{
              color: "var(--accent-primary)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Sign Up
          </Link>
        </div>

        {/* LEGAL LINKS FOOTNOTE */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "14px",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "0.76rem",
            color: "var(--text-muted)",
          }}
        >
          <Link href="/privacy-policy" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/terms" style={{ color: "var(--text-muted)", textDecoration: "none" }}>
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container-narrow" style={{ paddingTop: "80px", textAlign: "center" }}>
          <span className="badge badge-yellow pulse">Loading Authentication...</span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
