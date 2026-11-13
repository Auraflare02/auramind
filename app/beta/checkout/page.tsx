import type { Metadata } from "next";
import { Suspense } from "react";
import BetaCheckoutClient from "@/components/BetaCheckoutClient";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Join AuraMind Beta – ₹99 Special Reservation",
  description: "Secure your spot in the AuraMind 100-user Beta Programme. ₹99 one-time payment for 20 days full access.",
  path: "/beta/checkout",
  noIndex: true,
});

export default function BetaCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg)", color: "var(--text)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)", marginBottom: "8px" }}>
              Loading Beta Reservation...
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Reserving your beta slot</p>
          </div>
        </div>
      }
    >
      <BetaCheckoutClient />
    </Suspense>
  );
}
