import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Goal Workspace – AuraMind AI Accountability",
  description: "Private 30-day goal execution workspace, timer, and daily milestones.",
  path: "/goal",
  noIndex: true,
});

export default function GoalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
