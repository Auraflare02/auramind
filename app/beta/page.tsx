import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/config";
import BetaPageClient from "@/components/BetaPageClient";

export const metadata: Metadata = constructMetadata({
  title: "Join the ₹99 Beta Programme – AuraMind AI Accountability",
  description:
    "Join the limited 100-user AuraMind beta programme. Experience 20 days of AI goal planning, 30-day personalized timetables, and hourly check-ins for ₹99.",
  path: "/beta",
});

export default function BetaPage() {
  return <BetaPageClient />;
}
