import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://arogyacare.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "Arogya Care - AI Patient Triage & Clinical Decision Support",
    template: "%s | Arogya Care - AI Patient Triage",
  },
  description:
    "Arogya Care is an AI-powered intelligent triage system that delivers real-time clinical decision support, risk prediction, and smart patient routing for faster care delivery.",
  keywords: [
    "AI triage",
    "patient triage",
    "clinical decision support",
    "healthcare AI",
    "smart routing",
    "risk prediction",
    "Arogya Care",
  ],
  authors: [{ name: "Arogya Care Team" }],
  creator: "Arogya Care",
  publisher: "Arogya Care",

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "Arogya Care",
    title: "Arogya Care - Intelligent Triage Infrastructure",
    description:
      "AI-powered patient triage for faster, smarter clinical decision support and care delivery.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Arogya Care - Intelligent Triage Infrastructure",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Arogya Care - AI Patient Triage",
    description:
      "Real-time clinical decision support powered by explainable AI.",
    images: ["/og-image.png"],
    creator: "@arogyacare",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Arogya Care",
  },

  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },

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

  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  name: "Arogya Care - Intelligent Triage",
  url: BASE_URL,
  description:
    "AI-powered intelligent triage system providing real-time clinical decision support, risk prediction, and smart patient routing.",
  medicalAudience: {
    "@type": "MedicalAudience",
    audienceType: "Patient",
  },
  specialty: {
    "@type": "MedicalSpecialty",
    name: "Emergency Medicine",
  },
  publisher: {
    "@type": "Organization",
    name: "Arogya Care",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/icons/icon-512x512.png`,
    },
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/triage`,
    name: "Start Triage Assessment",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
