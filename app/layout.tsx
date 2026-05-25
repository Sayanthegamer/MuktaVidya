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
  title: {
    default: "MuktaVidya AI - Indian Competitive Exams AI Solver",
    template: "%s | MuktaVidya AI",
  },
  description: "Instant, AI-powered step-by-step solutions for Indian competitive exams like JEE Main, NEET, and WBJEE.",
  keywords: [
    "MuktaVidya",
    "JEE Main",
    "NEET",
    "WBJEE",
    "AI Solver",
    "Math Solver",
    "Physics Solver",
    "Chemistry Solver",
    "IIT JEE Preparation",
    "Academic Evaluator",
    "Step-by-step solutions",
  ],
  authors: [{ name: "MuktaVidya Team" }],
  creator: "MuktaVidya Team",
  publisher: "MuktaVidya",
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "MuktaVidya AI - Indian Competitive Exams AI Solver",
    description: "Instant, AI-powered step-by-step solutions for Indian competitive exams like JEE Main, NEET, and WBJEE.",
    url: "https://muktavidya.vercel.app",
    siteName: "MuktaVidya AI",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MuktaVidya AI - Step-by-Step AI Solutions for JEE, NEET, and WBJEE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MuktaVidya AI - Indian Competitive Exams AI Solver",
    description: "Instant, AI-powered step-by-step solutions for Indian competitive exams like JEE Main, NEET, and WBJEE.",
    images: ["/opengraph-image"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
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
