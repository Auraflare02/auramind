import type { Metadata } from "next";
import { Suspense } from "react";
import FailedClient from "@/components/payments/FailedClient";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Payment Verification Issue – AuraMind",
  description: "There was an issue verifying your payment reference. Please check your UTR or retry checkout.",
  path: "/payment/failed",
  noIndex: true,
});

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading payment status...</p>
        </div>
      }
    >
      <FailedClient />
    </Suspense>
  );
}
