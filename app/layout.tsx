import type { Metadata } from "next";
import { Geist, Geist_Mono, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: {
    default: "3pt Bot - Basketball Card Information",
    template: "%s | 3pt Bot"
  },
  description: "Comprehensive compendium of basketball trading card information featuring player cards, sets, and releases from Panini, Topps, and more. Your ultimate basketball card reference and collector's guide.",
  keywords: [
    "basketball cards",
    "NBA cards",
    "trading cards",
    "panini basketball cards",
    "topps basketball",
    "basketball card database",
    "basketball trading cards",
    "basketball collectibles",
    "player cards",
    "basketball card information",
    "card collecting",
    "sports cards",
    "NBA trading cards",
    "college basketball cards"
  ],
  authors: [{ name: "3pt Bot" }],
  creator: "3pt Bot",
  publisher: "3pt Bot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.3pt.bot"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "3pt Bot - Basketball Card Information",
    description: "Comprehensive compendium of basketball trading card information featuring player cards, sets, and releases. Your ultimate basketball card reference.",
    url: "https://www.3pt.bot",
    siteName: "3pt Bot",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "3pt Bot - Basketball Card Compendium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "3pt Bot - Basketball Card Information",
    description: "Comprehensive compendium of basketball trading card information. Your ultimate basketball card reference and collector's guide.",
    images: ["/twitter-image.png"],
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
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
