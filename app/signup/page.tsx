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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auth Method Switcher
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

  // Shared state
  const [fullName, setFullName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [consentPersonalData, setConsentPersonalData] = useState(false);
  const [optionalUpdates, setOptionalUpdates] = useState(false);

  // Email / Password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Mobile / OTP state
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
  const [confirmationNotice, setConfirmationNotice] = useState(false);

  const nextPath = searchParams.get("next") || "/dashboard";

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

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strengthScore = getPasswordStrength(password);
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#EF4444", "#F59E0B", "#22C55E", "var(--accent-primary)"];

  // 1. Mobile OTP: Send Code
  const handleSendSignupOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isOtpSending) return;

    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    const fullPhone = getFullPhone();
    if (!phoneNumber.trim() || fullPhone.length < 9) {
      setErrorMessage("Please enter a valid mobile number.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("You must agree to the AuraMind Terms & Conditions to create an account.");
      return;
    }

    if (!consentPersonalData) {
      setErrorMessage("You must consent to the processing of your personal information to proceed.");
      return;
    }

    setIsOtpSending(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone: fullPhone,
          isSignup: true,
          fullName: fullName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setNormalizedPhone(data.phone || fullPhone);
      setOtpSent(true);
      setResendCountdown(30);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send OTP. Please check your mobile number.");
    } finally {
      setIsOtpSending(false);
    }
  };

  // 2. Mobile OTP: Verify and Register
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOtpVerifying) return;

    setErrorMessage("");

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
          isSignup: true,
          fullName: fullName.trim(),
          agreeTerms: true,
          consentPersonalData: true,
          next: nextPath,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify code.");
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

  // 3. Email / Password Signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading) return;

    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("You must agree to the AuraMind Terms & Conditions to create an account.");
      return;
    }

    if (!consentPersonalData) {
      setErrorMessage("You must consent to the processing of your personal information to proceed with account creation.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          next: nextPath,
          agree_terms: agreeTerms,
          consent_personal_data: consentPersonalData,
          optional_updates: optionalUpdates,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create an account.");
      }

      if (data.needsConfirmation) {
        setConfirmationNotice(true);
      } else {
        const safeDestination = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
        router.push(safeDestination);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create an account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Google OAuth
  const handleGoogleSignup = () => {
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
          maxWidth: "460px",
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
            Start Your Journey
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
            Create your AuraMind account and turn goals into progress.
          </p>
        </div>

        {/* CONFIRMATION NOTICE */}
        {confirmationNotice ? (
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
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Check Your Inbox</h2>
            <p style={{ fontSize: "0.875rem", marginBottom: "20px", color: "var(--text-secondary)" }}>
              We&rsquo;ve dispatched a confirmation link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Open the email and click the confirmation link to activate your AuraMind account.
            </p>
            <Link href="/login" className="btn btn-secondary" style={{ width: "100%" }}>
              Return to Log In
            </Link>
          </div>
        ) : (
          <>
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

            {/* METHOD 1: MOBILE SIGNUP */}
            {authMethod === "phone" ? (
              <div>
                {!otpSent ? (
                  <form onSubmit={handleSendSignupOtp}>
                    <div className="form-group" style={{ marginBottom: "14px" }}>
                      <label className="form-label" htmlFor="signup-phone-name">
                        Full Name
                      </label>
                      <input
                        id="signup-phone-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Alex Carter"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="form-input"
                        style={{
                          height: "44px",
                          borderRadius: "8px",
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: "16px" }}>
                      <label className="form-label" htmlFor="signup-phone">
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
                          id="signup-phone"
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
                        We&rsquo;ll send a 6-digit one-time code to this number.
                      </div>
                    </div>

                    {/* CONSENT CHECKBOXES */}
                    <div
                      style={{
                        backgroundColor: "var(--bg-secondary)",
                        padding: "14px",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        border: "1px solid var(--border-subtle)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <input
                          id="consent-terms-phone"
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          required
                          style={{
                            accentColor: "var(--accent-primary)",
                            cursor: "pointer",
                            width: "18px",
                            height: "18px",
                            marginTop: "2px",
                            flexShrink: 0,
                          }}
                        />
                        <label htmlFor="consent-terms-phone" style={{ fontSize: "0.825rem", cursor: "pointer", lineHeight: "1.4" }}>
                          I agree to the AuraMind{" "}
                          <Link href="/terms" target="_blank" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "underline" }}>
                            Terms &amp; Conditions
                          </Link>{" "}
                          <span style={{ color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 700 }}>(Required)</span>
                        </label>
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <input
                          id="consent-privacy-phone"
                          type="checkbox"
                          checked={consentPersonalData}
                          onChange={(e) => setConsentPersonalData(e.target.checked)}
                          required
                          style={{
                            accentColor: "var(--accent-primary)",
                            cursor: "pointer",
                            width: "18px",
                            height: "18px",
                            marginTop: "2px",
                            flexShrink: 0,
                          }}
                        />
                        <label htmlFor="consent-privacy-phone" style={{ fontSize: "0.825rem", cursor: "pointer", lineHeight: "1.4" }}>
                          I consent to data processing under the{" "}
                          <Link href="/privacy-policy" target="_blank" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "underline" }}>
                            Privacy Policy
                          </Link>{" "}
                          <span style={{ color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 700 }}>(Required)</span>
                        </label>
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
                  <form onSubmit={handleVerifySignupOtp}>
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
                      <label className="form-label" htmlFor="signup-otp">
                        Enter 6-Digit OTP
                      </label>
                      <input
                        id="signup-otp"
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
                            onClick={() => handleSendSignupOtp()}
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
                      {isOtpVerifying ? "Verifying..." : "Verify & Create Account"}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* METHOD 2: EMAIL & PASSWORD SIGNUP */
              <form onSubmit={handleEmailSignup}>
                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" htmlFor="signup-name">
                    Full Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Alex Carter"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="form-input"
                    style={{
                      height: "44px",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" htmlFor="signup-email">
                    Email Address
                  </label>
                  <input
                    id="signup-email"
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

                <div className="form-group" style={{ marginBottom: "14px" }}>
                  <label className="form-label" htmlFor="signup-password">
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Minimum 8 characters"
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

                  {password.length > 0 && (
                    <div style={{ marginTop: "6px" }}>
                      <div style={{ display: "flex", gap: "4px", height: "4px", borderRadius: "2px", overflow: "hidden", backgroundColor: "var(--bg-secondary)" }}>
                        {[0, 1, 2, 3].map((step) => (
                          <div
                            key={step}
                            style={{
                              flex: 1,
                              backgroundColor: step < strengthScore ? strengthColors[strengthScore - 1] : "transparent",
                              transition: "background-color 0.2s ease",
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "0.72rem" }}>
                        <span style={{ color: "var(--text-muted)" }}>Strength:</span>
                        <span style={{ fontWeight: 700, color: strengthScore > 0 ? strengthColors[strengthScore - 1] : "var(--text-muted)" }}>
                          {strengthScore > 0 ? strengthLabels[strengthScore - 1] : "Too short"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label" htmlFor="signup-confirm-password">
                    Confirm Password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    style={{
                      height: "44px",
                      borderRadius: "8px",
                    }}
                  />
                </div>

                {/* CONSENT CHECKBOXES */}
                <div
                  style={{
                    backgroundColor: "var(--bg-secondary)",
                    padding: "14px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <input
                      id="consent-terms-email"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      required
                      style={{
                        accentColor: "var(--accent-primary)",
                        cursor: "pointer",
                        width: "18px",
                        height: "18px",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <label htmlFor="consent-terms-email" style={{ fontSize: "0.825rem", cursor: "pointer", lineHeight: "1.4" }}>
                      I agree to the AuraMind{" "}
                      <Link href="/terms" target="_blank" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "underline" }}>
                        Terms &amp; Conditions
                      </Link>{" "}
                      <span style={{ color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 700 }}>(Required)</span>
                    </label>
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <input
                      id="consent-privacy-email"
                      type="checkbox"
                      checked={consentPersonalData}
                      onChange={(e) => setConsentPersonalData(e.target.checked)}
                      required
                      style={{
                        accentColor: "var(--accent-primary)",
                        cursor: "pointer",
                        width: "18px",
                        height: "18px",
                        marginTop: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <label htmlFor="consent-privacy-email" style={{ fontSize: "0.825rem", cursor: "pointer", lineHeight: "1.4" }}>
                      I consent to data processing under the{" "}
                      <Link href="/privacy-policy" target="_blank" style={{ color: "var(--accent-primary)", fontWeight: 700, textDecoration: "underline" }}>
                        Privacy Policy
                      </Link>{" "}
                      <span style={{ color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 700 }}>(Required)</span>
                    </label>
                  </div>
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
                  {isLoading ? "Creating Account..." : "Create Account with Email"}
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
                OR SIGN UP WITH
              </span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-default)" }} />
            </div>

            {/* GOOGLE OAUTH BUTTON */}
            <button
              type="button"
              onClick={handleGoogleSignup}
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

            {/* FOOTER SWITCH */}
            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Already have an account? </span>
              <Link
                href={`/login${nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
                style={{
                  color: "var(--accent-primary)",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Log In
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
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="container-narrow" style={{ paddingTop: "80px", textAlign: "center" }}>
          <span className="badge badge-yellow pulse">Loading Registration...</span>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
