import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Footy Limited's Compendium of Soccer (Football) Card Information",
    template: "%s | Footy Limited"
  },
  description: "Comprehensive compendium of football trading card information featuring player cards, sets, and releases from Panini, Topps, and more. Your ultimate soccer card reference and collector's guide.",
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
  authors: [{ name: "Footy Limited" }],
  creator: "Footy Limited",
  publisher: "Footy Limited",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.footylimited.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Footy Limited's Compendium of Soccer (Football) Card Information",
    description: "Comprehensive compendium of football trading card information featuring player cards, sets, and releases. Your ultimate soccer card reference.",
    url: "https://www.footylimited.com",
    siteName: "Footy Limited",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Footy Limited - Soccer Card Compendium",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Footy Limited's Compendium of Soccer (Football) Card Information",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
