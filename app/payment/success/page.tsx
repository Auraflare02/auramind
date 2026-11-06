import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessClient from "@/components/payments/SuccessClient";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Subscription Activated! – AuraMind",
  description: "Your payment has been verified and your premium AuraMind subscription plan is now active.",
  path: "/payment/success",
  noIndex: true,
});

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
          <p style={{ color: "var(--text-muted)" }}>Confirming activation status...</p>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
