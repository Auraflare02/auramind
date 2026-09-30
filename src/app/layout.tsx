import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuraMind — AI Accountability",
  description: "Track your real day, understand distractions, and improve every week."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
