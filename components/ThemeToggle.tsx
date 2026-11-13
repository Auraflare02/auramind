"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"midnight" | "forest">("midnight");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("auramind-theme");
      if (stored === "forest" || stored === "midnight") {
        setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
      } else {
        setTheme("midnight");
        document.documentElement.setAttribute("data-theme", "midnight");
      }
    } catch {
      // Storage blocked fallback
      document.documentElement.setAttribute("data-theme", "midnight");
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "midnight" ? "forest" : "midnight";
    setTheme(nextTheme);
    try {
      localStorage.setItem("auramind-theme", nextTheme);
      document.documentElement.setAttribute("data-theme", nextTheme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", nextTheme === "forest" ? "rgb(15, 26, 20)" : "rgb(10, 10, 15)");
      }
    } catch {
      // Storage blocked fallback
      document.documentElement.setAttribute("data-theme", nextTheme);
    }
  };

  const isForest = theme === "forest";

  // Render stable button before mounting to prevent layout shifts
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Switch theme"
      aria-pressed={mounted ? isForest : false}
      title={isForest ? "Active: Forest Study (Click to switch to Midnight Focus)" : "Active: Midnight Focus (Click to switch to Forest Study)"}
      className="theme-toggle-btn"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "40px",
        minWidth: "40px",
        padding: "8px 14px",
        borderRadius: "8px",
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 600,
        lineHeight: 1,
        userSelect: "none",
      }}
    >
      {mounted && isForest ? (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Forest Leaf Icon */}
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
          <span>Forest</span>
        </>
      ) : (
        <>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {/* Midnight Moon Icon */}
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            <path d="M19 3v4" />
            <path d="M21 5h-4" />
          </svg>
          <span>Midnight</span>
        </>
      )}
    </button>
  );
}
