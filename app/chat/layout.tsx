import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "AI Cognitive Assistant – AuraMind",
  description: "Interactive AI goal guidance and cognitive assistance.",
  path: "/chat",
  noIndex: true,
});

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
