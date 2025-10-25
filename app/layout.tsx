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
    default: "Footy Bot - Soccer (Football) Card Information",
    template: "%s | Footy Bot"
  },
  description: "Comprehensive compendium of football trading card information featuring player cards, sets, and releases from Panini, Topps, and more. Your ultimate soccer card reference and collector's guide.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    "soccer cards",
    "football cards",
    "trading cards",
    "panini soccer cards",
    "topps soccer",
    "soccer card database",
    "football trading cards",
    "soccer collectibles",
    "player cards",
    "soccer card information",
    "card collecting",
    "sports cards"
  ],
  authors: [{ name: "Footy Bot" }],
  creator: "Footy Bot",
  publisher: "Footy Bot",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.footy.bot"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Footy Bot - Soccer (Football) Card Information",
    description: "Comprehensive compendium of football trading card information featuring player cards, sets, and releases. Your ultimate soccer card reference.",
    url: "https://www.footy.bot",
    siteName: "Footy Bot",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Footy Bot - Soccer Card Compendium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Footy Bot - Soccer (Football) Card Information",
    description: "Comprehensive compendium of football trading card information. Your ultimate soccer card reference and collector's guide.",
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
