"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface CalendarStatusData {
  connected: boolean;
  email: string | null;
  calendarId: string;
  autoSync: boolean;
  syncDeletions: boolean;
  lastSyncedAt: string | null;
  syncStatus: "connected" | "syncing" | "synced" | "error" | "disconnected";
  syncError: string | null;
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Google Calendar Integration State
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatusData | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deletePhrase, setDeletePhrase] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadCalendarStatus = useCallback(async () => {
    try {
      setIsLoadingCalendar(true);
      const res = await fetch("/api/calendar/status");
      if (res.ok) {
        const data = await res.json();
        setCalendarStatus(data);
      }
    } catch (e) {
      console.warn("[calendar status error]", e);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, []);

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
    loadCalendarStatus();
  }, [router, loadCalendarStatus]);

  // Handle URL parameters from Google OAuth redirection
  useEffect(() => {
    const isConnected = searchParams.get("calendar_connected");
    const accountEmail = searchParams.get("calendar_account");
    const errorParam = searchParams.get("calendar_error");

    if (isConnected === "true") {
      setCalendarMessage({
        type: "success",
        text: `Google Calendar successfully connected${accountEmail ? ` (${accountEmail})` : ""}! Your scheduled blocks can now synchronize automatically.`,
      });
      loadCalendarStatus();
    } else if (errorParam) {
      setCalendarMessage({
        type: "error",
        text: decodeURIComponent(errorParam),
      });
    }
  }, [searchParams, loadCalendarStatus]);

  const handleConnectCalendar = () => {
    window.location.href = "/api/calendar/connect?returnUrl=/settings";
  };

  const handleDisconnectCalendar = async () => {
    if (!confirm("Are you sure you want to disconnect Google Calendar? Existing calendar events will be kept, but new schedules won't sync.")) {
      return;
    }

    setIsDisconnectingCalendar(true);
    setCalendarMessage(null);

    try {
      const res = await fetch("/api/calendar/disconnect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disconnect Google Calendar.");

      setCalendarMessage({ type: "success", text: "Google Calendar disconnected. Synchronization paused." });
      await loadCalendarStatus();
    } catch (err: any) {
      setCalendarMessage({ type: "error", text: err.message || "Failed to disconnect." });
    } finally {
      setIsDisconnectingCalendar(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncingCalendar(true);
    setCalendarMessage(null);

    try {
      const res = await fetch("/api/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Synchronization failed.");

      setCalendarMessage({
        type: "success",
        text: `Calendar synced: ${data.created} event(s) created, ${data.updated} updated, ${data.skipped} already up to date.`,
      });
      await loadCalendarStatus();
    } catch (err: any) {
      setCalendarMessage({ type: "error", text: err.message || "Failed to synchronize schedule." });
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  const handleToggleAutoSync = async () => {
    if (!calendarStatus) return;
    const nextVal = !calendarStatus.autoSync;
    try {
      const res = await fetch("/api/calendar/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto_sync: nextVal }),
      });
      if (res.ok) {
        setCalendarStatus({ ...calendarStatus, autoSync: nextVal });
      }
    } catch (e) {
      console.warn("Could not toggle auto sync:", e);
    }
  };

  const handleToggleSyncDeletions = async () => {
    if (!calendarStatus) return;
    const nextVal = !calendarStatus.syncDeletions;
    try {
      const res = await fetch("/api/calendar/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sync_deletions: nextVal }),
      });
      if (res.ok) {
        setCalendarStatus({ ...calendarStatus, syncDeletions: nextVal });
      }
    } catch (e) {
      console.warn("Could not toggle sync deletions:", e);
    }
  };

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

  const isConnected = calendarStatus?.connected;

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
      <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
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

      {/* 3. GOOGLE CALENDAR INTEGRATION CARD */}
      <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
        <div className="flex-between" style={{ marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  backgroundColor: "#FFD600",
                  color: "#080808",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "14px",
                }}
              >
                📅
              </div>
              <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--text-primary)" }}>
                Google Calendar Integration
              </h2>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: "6px", marginBottom: 0, maxWidth: "560px" }}>
              Sync your AuraMind schedule with Google Calendar. Keep your daily tasks, study sessions, focus blocks, and planned activities organized in one place.
            </p>
          </div>

          {!isLoadingCalendar && (
            <div>
              {isConnected ? (
                <span className="badge badge-yellow" style={{ fontSize: "0.78rem" }}>
                  ● Connected
                </span>
              ) : (
                <span className="badge badge-gray" style={{ fontSize: "0.78rem" }}>
                  Not Connected
                </span>
              )}
            </div>
          )}
        </div>

        {calendarMessage && (
          <div
            className={`alert ${calendarMessage.type === "success" ? "alert-success" : "alert-error"}`}
            style={{ margin: "16px 0", fontSize: "0.85rem" }}
          >
            {calendarMessage.text}
          </div>
        )}

        {isLoadingCalendar ? (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <span className="text-xs text-muted">Checking integration status...</span>
          </div>
        ) : !isConnected ? (
          // Disconnected view
          <div
            style={{
              padding: "20px",
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-default)",
              borderRadius: "10px",
              marginTop: "16px",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                Connect Google Calendar
              </div>
              <p className="text-xs text-secondary" style={{ margin: 0, lineHeight: 1.5 }}>
                AuraMind will request authorization to manage your study blocks and deliberate practice sessions. We use strict least-privilege permissions and will never alter or delete your unrelated personal calendar events.
              </p>
            </div>

            <button
              type="button"
              onClick={handleConnectCalendar}
              className="btn btn-primary"
              style={{
                borderRadius: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 700,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#000"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#000"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#000"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#000"
                />
              </svg>
              Connect Google Calendar
            </button>
          </div>
        ) : (
          // Connected view
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
            {/* Status overview banner */}
            <div
              style={{
                padding: "16px 20px",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                  Connected Account
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                  {calendarStatus?.email || "Google Account"}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Destination: <strong style={{ color: "var(--accent-primary)" }}>Primary Google Calendar</strong>
                  {calendarStatus?.lastSyncedAt && (
                    <span> &bull; Last synchronized: {new Date(calendarStatus.lastSyncedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncingCalendar}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: "6px", fontWeight: 700 }}
                >
                  {isSyncingCalendar ? "Syncing Schedule..." : "⟳ Sync Now"}
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectCalendar}
                  disabled={isDisconnectingCalendar}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: "6px", color: "var(--error)" }}
                >
                  {isDisconnectingCalendar ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>

            {/* Sync Settings Toggles */}
            <div
              style={{
                padding: "18px 20px",
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
                borderRadius: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
                Synchronization Preferences
              </div>

              {/* Auto sync toggle */}
              <div className="flex-between" style={{ flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    Sync New Schedule Automatically
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    When you start a new 30-day plan, automatically schedule eligible practice blocks in your calendar.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoSync}
                  className={`btn btn-sm ${calendarStatus?.autoSync ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: "6px" }}
                >
                  {calendarStatus?.autoSync ? "Enabled" : "Disabled"}
                </button>
              </div>

              {/* Sync deletions toggle */}
              <div className="flex-between" style={{ flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    Synchronize Schedule Deletions
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    When a task is permanently removed in AuraMind, also remove its corresponding Google Calendar event.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSyncDeletions}
                  className={`btn btn-sm ${calendarStatus?.syncDeletions ? "btn-primary" : "btn-secondary"}`}
                  style={{ fontSize: "0.78rem", padding: "4px 12px", borderRadius: "6px" }}
                >
                  {calendarStatus?.syncDeletions ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. PRIVACY & CONSENT MANAGEMENT CARD */}
      <div className="card" style={{ marginBottom: "24px", padding: "28px" }}>
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

      {/* 5. DANGER ZONE: ACCOUNT DELETION */}
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

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-narrow" style={{ paddingTop: "80px", textAlign: "center" }}>
          <span className="badge badge-yellow pulse">Loading Account Settings...</span>
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
