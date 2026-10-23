"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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

  // Handle Email / Password Login
  const handleLogin = async (e: React.FormEvent) => {
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
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Incorrect email or password. Please verify and try again.");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Please verify your email address before logging in. Check your inbox for the confirmation link.");
        }
        throw new Error(error.message);
      }

      if (data.session) {
        // Safe redirect to intended destination
        const safeDestination = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
        router.push(safeDestination);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth Login
  const handleGoogleLogin = async () => {
    if (isLoading || isGoogleLoading) return;

    setErrorMessage("");
    setIsGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to initialize Google authentication.");
      setIsGoogleLoading(false);
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
        {/* BRANDMARK */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                backgroundColor: "var(--accent-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "18px",
                color: "var(--text-inverse)",
                boxShadow: "0 0 16px var(--accent-glow)",
              }}
            >
              A
            </div>
            <span
              style={{
                fontSize: "1.4rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              AuraMind
            </span>
          </Link>

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
            Continue your journey with AuraMind.
          </p>
        </div>

        {/* ALERTS */}
        {errorMessage && (
          <div
            className="alert alert-error"
            style={{
              marginBottom: "20px",
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
              marginBottom: "20px",
              fontSize: "0.85rem",
              padding: "10px 14px",
              borderRadius: "8px",
            }}
          >
            {successMessage}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleLogin}>
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

          {/* REMEMBER SESSION CHECKBOX */}
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

          {/* SUBMIT BUTTON */}
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
            {isLoading ? "Signing in..." : "Log In"}
          </button>
        </form>

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
          disabled={isLoading || isGoogleLoading}
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

