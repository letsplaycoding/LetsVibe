import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeLog",
  description: "Turn AI coding sessions into explainable development history."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
