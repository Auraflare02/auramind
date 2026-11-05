import type { Metadata } from "next";
import { constructMetadata } from "@/lib/seo/config";

export const metadata: Metadata = constructMetadata({
  title: "Friends & Social Accountability – AuraMind",
  description: "Connect with accountability peers and exchange goal progress.",
  path: "/friends",
  noIndex: true,
});

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
