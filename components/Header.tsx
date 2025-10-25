"use client";

import Link from "next/link";
import EbayAdHorizontal from "./EbayAdHorizontal";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface HeaderProps {
  showBackButton?: boolean;
  rounded?: boolean;
  showAd?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
}

export default function Header({ showBackButton = false, rounded = true, showAd = false, breadcrumbItems }: HeaderProps) {
  return (
    <header className={`bg-gradient-to-r from-footy-green to-green-700 text-white shadow-lg ${rounded ? 'rounded-xl' : ''}`}>
      <div className="px-6 py-8">
        {/* Top section with breadcrumb or back button */}
        {(breadcrumbItems && breadcrumbItems.length > 0) ? (
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbItems.map((item, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 mx-2 text-green-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="font-semibold text-white">{item.label}</span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-green-100 hover:text-footy-orange transition-colors font-medium"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : showBackButton && (
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
          <h1 className="text-4xl md:text-5xl font-bold">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              footy<span className="text-footy-orange">.bot</span>
            </Link>
          </h1>
        </div>

        {/* Navigation menu */}
        <nav className="flex justify-center items-center gap-6 border-t border-green-600 pt-6">
          <Link
            href="/"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Home
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
          <Link
            href="/cards"
            className="text-green-100 hover:text-white transition-colors text-sm md:text-base font-medium"
          >
            Cards
          </Link>
        </nav>
      </div>

      {/* Optional ad space below header */}
      {showAd && (
        <div className="px-6 pb-6">
          <EbayAdHorizontal query="soccer trading cards" limit={4} title="Featured Soccer Cards" />
        </div>
      )}
    </header>
  );
}
