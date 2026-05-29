import type { Metadata } from "next";
import { LanguageClient } from "./language-client";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeLog",
  description: "Turn AI coding sessions into explainable development history."
};

const themeScript = `
(() => {
  try {
    const storedTheme = localStorage.getItem("vibelog-theme") || "system";
    const theme = storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "system";
    const resolvedTheme = theme === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = theme;
    document.documentElement.style.colorScheme = resolvedTheme;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.dataset.themePreference = "system";
  }
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <LanguageClient />
      </body>
    </html>
  );
}
