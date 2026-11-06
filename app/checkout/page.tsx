import type { Metadata } from "next";
import { Suspense } from "react";
import CheckoutClient from "@/components/CheckoutClient";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Checkout – Choose Your AuraMind Subscription",
  description: "Secure UPI checkout for AuraMind Gold, Platinum, and Diamond subscription plans.",
  path: "/checkout",
  noIndex: true, // Prevent search engines from indexing active checkout sessions
});

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808", color: "#FFFFFF" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent-primary)", marginBottom: "8px" }}>
              Loading Checkout...
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Preparing secure payment session</p>
          </div>
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
