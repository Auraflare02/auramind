"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserInfo {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
}

export default function AuthNav() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/user");
        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const user = data.user;

        if (user) {
          const name =
            data.profile?.full_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Pioneer";
          const avatarUrl =
            data.profile?.avatar_url ||
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          setUser({
            id: user.id,
            email: user.email || null,
            name,
            avatarUrl,
          });

          // Fetch pending incoming friend requests count
          try {
            const fRes = await fetch("/api/friends/data");
            if (fRes.ok) {
              const fData = await fRes.json();
              if (Array.isArray(fData.incomingRequests)) {
                setPendingRequests(fData.incomingRequests.length);
              }
            }
          } catch {
            // Silently ignore network warning
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          width: "72px",
          height: "32px",
          borderRadius: "9999px",
          backgroundColor: "var(--bg-elevated)",
          opacity: 0.5,
        }}
      />
    );
  }

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link
          href="/friends"
          style={{
            color: "var(--text-primary)",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 10px",
            borderRadius: "9999px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            transition: "all var(--transition-fast)",
          }}
          title="Friends & Social Accountability"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Friends</span>
          {pendingRequests > 0 && (
            <span
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "#000000",
                fontSize: "0.68rem",
                fontWeight: 800,
                borderRadius: "9999px",
                minWidth: "16px",
                height: "16px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
                lineHeight: 1,
              }}
            >
              {pendingRequests}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard"
          className="btn btn-secondary btn-sm"
          style={{
            borderRadius: "9999px",
            padding: "5px 14px",
            fontSize: "0.8rem",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-primary)",
              }}
            />
          )}
          <span>Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <Link
        href="/login"
        style={{
          color: "var(--text-primary)",
          textDecoration: "none",
          fontSize: "0.85rem",
          fontWeight: 600,
          padding: "6px 12px",
          transition: "color var(--transition-fast)",
        }}
      >
        Log In
      </Link>
      <Link
        href="/signup"
        className="btn btn-primary btn-sm"
        style={{
          borderRadius: "9999px",
          padding: "6px 16px",
          fontSize: "0.825rem",
          fontWeight: 700,
        }}
      >
        Sign Up
      </Link>
    </div>
  );
}
