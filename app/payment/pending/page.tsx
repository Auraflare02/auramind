import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import PendingClient from "@/components/payments/PendingClient";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Payment Verification Pending – AuraMind",
  description: "Your payment proof has been received. Our team will verify and activate your subscription within 6 hours.",
  path: "/payment/pending",
  noIndex: true,
});

export default function PaymentPendingPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading verification status...</p>
        </div>
      }
    >
      <PendingClient />
    </Suspense>
  );
}
