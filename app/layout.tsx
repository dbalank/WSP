import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "WSP Nature Vista | EIA Screening Platform",
  description:
    "WSP Environmental Impact Assessment screening platform powered by Microsoft Agent Framework. AI-driven regulatory compliance, impact analysis, and report generation.",
  icons: {
    icon: "/favicon.ico",
    apple: "/images/wsp-circle.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff372f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
