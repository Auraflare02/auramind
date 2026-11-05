import type { Metadata } from "next";
import PricingClient from "@/components/PricingClient";
import { constructMetadata, getBreadcrumbSchema, getSoftwareApplicationSchema } from "@/lib/seo/config";
import JsonLd from "@/components/seo/JsonLd";

export const metadata: Metadata = constructMetadata({
  title: "AuraMind Pricing – Gold, Platinum & Diamond Plans",
  description:
    "Explore transparent AuraMind subscription plans: Gold (₹249/mo), Platinum (₹699/mo), and Diamond (₹1,299/mo). Compare goal quotas, WhatsApp check-ins, and AI phone calls.",
  path: "/pricing",
  keywords: [
    "AuraMind pricing",
    "AuraMind subscription plans",
    "Gold plan 249",
    "Platinum plan 699",
    "Diamond plan 1299",
    "AI accountability pricing",
    "WhatsApp accountability cost",
    "AI calling agent subscription",
  ],
});

export default function PricingPage() {
  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Pricing", path: "/pricing" },
  ]);

  return (
    <>
      <JsonLd data={[breadcrumbs, getSoftwareApplicationSchema()]} />
      <PricingClient />
    </>
  );
}
