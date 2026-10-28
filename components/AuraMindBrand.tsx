import React from "react";
import Link from "next/link";

interface AuraMindLogoProps {
  href?: string;
  height?: number;
  fontSize?: string | number;
  className?: string;
  showText?: boolean;
  compactOnMobile?: boolean;
}

export function AuraMindLogo({
  href = "/",
  height = 30,
  fontSize,
  className = "",
  showText = true,
  compactOnMobile = false,
}: AuraMindLogoProps) {
  const calculatedFontSize = fontSize
    ? typeof fontSize === "number"
      ? `${fontSize}px`
      : fontSize
    : `${Math.round(height * 0.68)}px`;

  const content = (
    <div
      className={`auramind-brand-wrapper ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        verticalAlign: "middle",
        userSelect: "none",
      }}
    >
      {/* Standalone Circular Symbol placed before the brand name */}
      <img
        src="/brand/auramind-symbol.png"
        alt="AuraMind logo"
        style={{
          height: `${height}px`,
          width: `${height}px`,
          borderRadius: "50%",
          objectFit: "contain",
          display: "inline-block",
          flexShrink: 0,
        }}
      />

      {/* Brand Name text - pure CSS typography with zero black image box */}
      {showText && (
        <span
          className={`auramind-brand-text ${compactOnMobile ? "auramind-text-responsive" : ""}`}
          style={{
            fontWeight: 800,
            fontSize: calculatedFontSize,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <span style={{ color: "var(--text-primary, #FFFFFF)" }}>AURA</span>
          <span style={{ color: "var(--accent-primary, #FFD600)" }}>MIND</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          textDecoration: "none",
          outline: "none",
        }}
        aria-label="AuraMind Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}

interface AuraMindSymbolProps {
  size?: number;
  className?: string;
  alt?: string;
}

export function AuraMindSymbol({
  size = 32,
  className = "",
  alt = "AuraMind symbol",
}: AuraMindSymbolProps) {
  return (
    <img
      src="/brand/auramind-symbol.png"
      alt={alt}
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: "contain",
        borderRadius: "50%",
        display: "inline-block",
        verticalAlign: "middle",
        flexShrink: 0,
      }}
    />
  );
}
