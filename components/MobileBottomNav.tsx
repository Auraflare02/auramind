"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [pendingRequests, setPendingRequests] = useState(0);

  // Load pending friend requests for the badge
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/friends/data");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.incomingRequests)) {
            setPendingRequests(data.incomingRequests.length);
          }
        }
      } catch {
        // Non-blocking
      }
    }
    loadMeta();
  }, [pathname]);

  const navItems = [
    {
      label: "Home",
      href: "/",
      isActive: pathname === "/",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "New Goal",
      href: "/#create-goal",
      isActive: false,
      isSpecial: true,
      icon: () => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      isActive: pathname.startsWith("/dashboard"),
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" />
          <rect x="14" y="3" width="7" height="5" />
          <rect x="14" y="12" width="7" height="9" />
          <rect x="3" y="16" width="7" height="5" />
        </svg>
      ),
    },
    {
      label: "Friends",
      href: "/friends",
      isActive: pathname.startsWith("/friends"),
      badge: pendingRequests > 0 ? pendingRequests : undefined,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Live Chat",
      href: "/community",
      isActive: pathname.startsWith("/community"),
      hasLivePulse: true,
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.4" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      className="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        backgroundColor: "var(--header-bg)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderTop: "1px solid var(--border-default)",
        display: "none", // Displayed only on <= 768px via CSS in globals.css
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 90,
        paddingBottom: "max(4px, env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
      }}
    >
      {navItems.map((item) => {
        const active = item.isActive;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              height: "100%",
              textDecoration: "none",
              color: item.isSpecial
                ? "var(--accent-primary)"
                : active
                ? "var(--accent-primary)"
                : "var(--text-secondary)",
              transition: "all var(--transition-fast)",
              position: "relative",
              padding: "4px 0",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {/* Active Indicator Bar on top */}
            {active && (
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  width: "28px",
                  height: "3px",
                  borderRadius: "0 0 3px 3px",
                  backgroundColor: "var(--accent-primary)",
                  boxShadow: "0 0 10px var(--accent-glow)",
                }}
              />
            )}

            {/* Icon Wrapper with potential Badges */}
            <div style={{ position: "relative", display: "inline-flex" }}>
              {item.icon(active)}

              {/* Pending Request Badge */}
              {item.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-8px",
                    backgroundColor: "var(--accent)",
                    color: "var(--on-accent)",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    borderRadius: "9999px",
                    padding: "1px 5px",
                    lineHeight: 1,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                  }}
                >
                  {item.badge}
                </span>
              )}

              {/* Green Live Pulse Dot for Live Chat */}
              {item.hasLivePulse && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-4px",
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    backgroundColor: "var(--success)",
                    boxShadow: "0 0 8px var(--success)",
                  }}
                />
              )}
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: active || item.isSpecial ? 700 : 500,
                letterSpacing: "-0.01em",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
