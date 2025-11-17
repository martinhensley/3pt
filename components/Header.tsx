"use client";

import Link from "next/link";
import EbayAdHorizontal from "./EbayAdHorizontal";

interface HeaderProps {
  showBackButton?: boolean;
  rounded?: boolean;
  showAd?: boolean;
}

export default function Header({ showBackButton = false, rounded = true, showAd = false }: HeaderProps) {
  return (
    <header className={`bg-gradient-to-r from-footy-green to-green-700 text-white shadow-lg ${rounded ? 'rounded-xl' : ''}`}>
      <div className="px-6 py-8">
        {/* Top section with back button */}
        {showBackButton && (
          <div className="mb-4">
            <Link
              href="/"
              className="inline-block text-footy-orange hover:text-white transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
        )}

        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold font-orbitron">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <span>3pt<span className="text-footy-orange">.bot</span></span>
            </Link>
          </h1>
        </div>

        {/* Navigation menu */}
        <nav className="flex justify-center items-center gap-6 border-t border-green-600 pt-6">
          <Link
            href="/cards"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Cards
          </Link>
          <Link
            href="/comps"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Comps
          </Link>
          <Link
            href="/checklists"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Checklists
          </Link>
          <Link
            href="/posts"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Posts
          </Link>
          <Link
            href="/releases"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Releases
          </Link>
        </nav>
      </div>

      {/* Optional ad space below header */}
      {showAd && (
        <div className="px-6 pb-6">
          <EbayAdHorizontal query="basketball trading cards" limit={4} title="Featured Basketball Cards" />
        </div>
      )}
    </header>
  );
}
