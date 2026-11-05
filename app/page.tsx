import type { Metadata } from "next";
import HomePageClient from "@/components/HomePageClient";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "AuraMind AI – Your Personal AI Accountability & Productivity Assistant",
  description:
    "Discover AuraMind, an AI-powered productivity and accountability platform that helps you set goals, create personalised schedules, track progress and stay consistent.",
  path: "/",
  keywords: [
    "AuraMind",
    "AuraMind AI",
    "AuraMind App",
    "AI Accountability Assistant",
    "AI Productivity App",
    "AI Goal Planner",
    "AI Goal Tracking App",
    "Personal Productivity AI",
    "AI Calling Assistant",
    "Goal Management Platform",
    "30-day timetable",
    "hourly check-ins",
    "WhatsApp accountability",
  ],
});

export default function HomePage() {
  return <HomePageClient />;
}
