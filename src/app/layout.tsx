import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INP Org Chart Studio",
  description: "Build, manage, and export organization charts as PDF or JSON.",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
