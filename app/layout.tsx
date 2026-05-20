import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://muktavidya.vercel.app"),
  title: "MuktaVidya AI",
  description: "Instant, AI-powered solutions to your toughest questions.",
  manifest: "/manifest.json",
  openGraph: {
    title: "MuktaVidya AI",
    description: "Instant, AI-powered solutions to your toughest questions.",
    url: "https://muktavidya.vercel.app",
    siteName: "MuktaVidya AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MuktaVidya AI",
    description: "Instant, AI-powered solutions to your toughest questions.",
  },
};

export const viewport = {
  themeColor: "#0a0a0b", // Updated to match dark theme surface-0
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
