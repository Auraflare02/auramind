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
