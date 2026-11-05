import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Live Community Chat – AuraMind",
  description: "Real-time world discussion for AuraMind pioneers.",
  path: "/community",
  noIndex: true,
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
