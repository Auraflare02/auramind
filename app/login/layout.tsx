import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Sign In – AuraMind AI Accountability Platform",
  description: "Sign in to your AuraMind account to access your 30-day goal timetables and daily focus workspace.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
