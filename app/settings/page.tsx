"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("email");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [optionalUpdates, setOptionalUpdates] = useState(false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);

  const [deletePhrase, setDeletePhrase] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) {
          router.push("/login?next=/settings");
          return;
        }

        const data = await res.json();
        const user = data.user;
        if (!user) {
          router.push("/login?next=/settings");
          return;
        }

        setUser(user);
        setEmail(user.email || "");
        setProvider(user.app_metadata?.provider || "email");

        const name =
          data.profile?.full_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "";
        setFullName(name);
        setAvatarUrl(data.profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null);
        setOptionalUpdates(Boolean(user.user_metadata?.optional_updates_consented));
      } catch (e) {
        console.error("[settings load error]", e);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadUser();
  }, [router]);

  const handleToggleConsent = async () => {
    if (isUpdatingConsent) return;
    setIsUpdatingConsent(true);
    setConsentMessage(null);
    const targetState = !optionalUpdates;

    try {
      const res = await fetch("/api/auth/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent_type: "product_updates", consented: targetState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update preference.");

      setOptionalUpdates(targetState);
      setConsentMessage(
        targetState
          ? "Consent granted: You are now subscribed to deliberate practice insights and product updates."
          : "Consent withdrawn: You will no longer receive optional marketing or practice emails."
      );
    } catch (err: any) {
      setConsentMessage(err.message || "Failed to update preference.");
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeletingAccount) return;
    setDeleteError(null);

    if (deletePhrase !== "DELETE MY ACCOUNT") {
      setDeleteError("Please type 'DELETE MY ACCOUNT' exactly to confirm permanent erasure.");
      return;
    }

    if (!confirm("Are you absolutely certain? This action cannot be undone. All goals, focus sessions, and records will be permanently erased.")) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm_phrase: deletePhrase }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account.");

      window.location.href = "/?message=Account+and+associated+data+permanently+deleted";
    } catch (err: any) {
      setDeleteError(err.message || "Failed to execute account deletion.");
      setIsDeletingAccount(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) return;

    setProfileMessage(null);
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");

      setProfileMessage({ type: "success", text: "Profile details updated successfully." });
    } catch (err: any) {
      setProfileMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingPassword) return;

    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");

      setPasswordMessage({ type: "success", text: "Password changed successfully." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      window.location.href = "/login";
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="container-narrow" style={{ paddingTop: "80px", textAlign: "center" }}>
        <span className="badge badge-yellow pulse">Loading Account Settings...</span>
      </div>
    );
  }

  return (
    <div className="container-narrow" style={{ paddingTop: "40px", paddingBottom: "72px" }}>
      {/* HEADER */}
      <div className="flex-between" style={{ marginBottom: "28px" }}>
        <div>
          <Link
            href="/dashboard"
            style={{
              fontSize: "0.825rem",
              color: "var(--accent-primary)",
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-block",
              marginBottom: "8px",
            }}
          >
            &larr; Back to Dashboard
          </Link>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
            Account Settings
          </h1>
        </div>

        <button type="button" onClick={handleSignOut} className="btn btn-secondary btn-sm">
          Log Out
        </button>
      </div>

      {/* 1. PROFILE DETAILS CARD */}
      <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "16px", color: "var(--text-primary)" }}>
          Profile Information
        </h2>

        {profileMessage && (
          <div
            className={`alert ${profileMessage.type === "success" ? "alert-success" : "alert-error"}`}
            style={{ marginBottom: "16px", fontSize: "0.85rem" }}
          >
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                referrerPolicy="no-referrer"
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--accent-primary)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-elevated)",
                  border: "2px solid var(--border-default)",
                  color: "var(--accent-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  fontWeight: 800,
                }}
              >
                {fullName.slice(0, 2).toUpperCase() || "AM"}
              </div>
            )}
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Profile Photo
              </div>
              <div className="text-xs text-muted">
                {provider === "google"
                  ? "Synchronized with your authenticated Google Account."
                  : "Assigned automatically via your account monogram."}
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" htmlFor="settings-name">
              Full Name
            </label>
            <input
              id="settings-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
              style={{ height: "42px", borderRadius: "8px" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" htmlFor="settings-email">
              Email Address
            </label>
            <input
              id="settings-email"
              type="email"
              disabled
              value={email}
              className="form-input"
              style={{
                height: "42px",
                borderRadius: "8px",
                opacity: 0.65,
                cursor: "not-allowed",
              }}
            />
            <span className="text-xs text-muted" style={{ display: "block", marginTop: "4px" }}>
              Authentication provider: <strong style={{ color: "var(--text-primary)" }}>{provider.toUpperCase()}</strong>. Email cannot be changed directly.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="btn btn-primary"
            style={{ borderRadius: "8px" }}
          >
            {isSavingProfile ? "Saving Changes..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* 2. PASSWORD SECURITY CARD */}
      <div className="card" style={{ padding: "28px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px", color: "var(--text-primary)" }}>
          Security &amp; Password
        </h2>
        <p className="text-xs text-secondary" style={{ marginBottom: "20px" }}>
          Ensure your account is protected with a resilient, unique passphrase.
        </p>

        {passwordMessage && (
          <div
            className={`alert ${passwordMessage.type === "success" ? "alert-success" : "alert-error"}`}
            style={{ marginBottom: "16px", fontSize: "0.85rem" }}
          >
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdatePassword}>
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="form-label" htmlFor="settings-password">
              New Password
            </label>
            <input
              id="settings-password"
              type="password"
              required
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              style={{ height: "42px", borderRadius: "8px" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" htmlFor="settings-confirm-password">
              Confirm New Password
            </label>
            <input
              id="settings-confirm-password"
              type="password"
              required
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              style={{ height: "42px", borderRadius: "8px" }}
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingPassword}
            className="btn btn-secondary"
            style={{ borderRadius: "8px" }}
          >
            {isUpdatingPassword ? "Updating Password..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* 3. PRIVACY & CONSENT MANAGEMENT CARD */}
      <div className="card" style={{ padding: "28px" }}>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "8px", color: "var(--text-primary)" }}>
          Privacy &amp; Statutory Consent Records
        </h2>
        <p className="text-xs text-secondary" style={{ marginBottom: "20px" }}>
          Manage your personal data processing consents in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>

        {consentMessage && (
          <div className="alert alert-success" style={{ marginBottom: "16px", fontSize: "0.85rem" }}>
            {consentMessage}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Terms & Conditions Active Record */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                AuraMind Terms &amp; Conditions
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Active Version: <strong>2026-10-V1</strong> • Required for service access.
              </div>
            </div>
            <Link
              href="/terms"
              target="_blank"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: "6px" }}
            >
              View Terms ↗
            </Link>
          </div>

          {/* Privacy Policy Active Record */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                AuraMind Privacy Policy
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Active Version: <strong>2026-10-V1</strong> • Explicit consent recorded upon registration.
              </div>
            </div>
            <Link
              href="/privacy-policy"
              target="_blank"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: "6px" }}
            >
              View Policy ↗
            </Link>
          </div>

          {/* Optional Consent Toggle: Product Updates & Tips */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ maxWidth: "480px" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>
                Optional Product &amp; Practice Insights
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Receive deliberate practice articles, productivity science tips, and product enhancements via email. You can withdraw consent at any time.
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleConsent}
              disabled={isUpdatingConsent}
              className={`btn btn-sm ${optionalUpdates ? "btn-secondary" : "btn-primary"}`}
              style={{ fontSize: "0.78rem", padding: "5px 14px", borderRadius: "6px" }}
            >
              {isUpdatingConsent
                ? "Updating..."
                : optionalUpdates
                ? "Withdraw Consent"
                : "Grant Consent"}
            </button>
          </div>
        </div>
      </div>

      {/* 4. DANGER ZONE: ACCOUNT DELETION */}
      <div
        className="card"
        style={{
          padding: "28px",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          backgroundColor: "rgba(239, 68, 68, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              backgroundColor: "var(--error)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 800,
            }}
          >
            !
          </div>
          <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--error)" }}>
            Danger Zone: Delete Account
          </h2>
        </div>
        <p className="text-xs text-secondary" style={{ marginBottom: "16px" }}>
          Permanently erase your AuraMind account in accordance with Section 11 of the Privacy Policy and DPDP Act right to erasure. This action is immediate and non-reversible.
        </p>

        {deleteError && (
          <div className="alert alert-error" style={{ marginBottom: "16px", fontSize: "0.85rem" }}>
            {deleteError}
          </div>
        )}

        <form onSubmit={handleDeleteAccount} style={{ maxWidth: "460px" }}>
          <div className="form-group" style={{ marginBottom: "14px" }}>
            <label className="form-label" htmlFor="delete-confirm-input" style={{ fontSize: "0.8rem" }}>
              To confirm, type <strong style={{ color: "var(--text-primary)" }}>DELETE MY ACCOUNT</strong> below:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              required
              placeholder="DELETE MY ACCOUNT"
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              className="form-input"
              style={{
                height: "40px",
                borderRadius: "8px",
                borderColor: deletePhrase === "DELETE MY ACCOUNT" ? "var(--error)" : "var(--border-default)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={deletePhrase !== "DELETE MY ACCOUNT" || isDeletingAccount}
            className="btn btn-secondary"
            style={{
              borderRadius: "8px",
              backgroundColor: deletePhrase === "DELETE MY ACCOUNT" ? "var(--error)" : "var(--bg-elevated)",
              color: deletePhrase === "DELETE MY ACCOUNT" ? "#fff" : "var(--text-muted)",
              borderColor: deletePhrase === "DELETE MY ACCOUNT" ? "var(--error)" : "var(--border-default)",
              fontWeight: 700,
            }}
          >
            {isDeletingAccount ? "Permanently Erasing Data..." : "Permanently Delete Account & Data"}
          </button>
        </form>
      </div>
    </div>
  );
}
