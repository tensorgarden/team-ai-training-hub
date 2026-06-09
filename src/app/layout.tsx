import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Team AI Training Hub — Prompt Library & Adoption Analytics",
  description: "Portfolio demo: Train your team on ChatGPT and Claude, track adoption, manage prompt libraries, and see analytics."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
