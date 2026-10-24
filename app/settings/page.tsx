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
      } catch (e) {
        console.error("[settings load error]", e);
      } finally {
        setIsLoadingProfile(false);
      }
    }

    loadUser();
  }, [router]);

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
    </div>
  );
}
