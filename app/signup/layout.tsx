import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Create Account – AuraMind AI Accountability Platform",
  description: "Create an AuraMind account to build personalized 30-day goal timetables, track focus habits, and stay accountable.",
  path: "/signup",
  noIndex: true,
});

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
