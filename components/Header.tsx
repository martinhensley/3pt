"use client";

import Link from "next/link";

interface HeaderProps {
  showBackButton?: boolean;
  rounded?: boolean;
}

export default function Header({ showBackButton = false, rounded = true }: HeaderProps) {
  return (
    <header className={`bg-gradient-to-r from-footy-green to-green-700 text-white shadow-lg ${rounded ? 'rounded-xl' : ''}`}>
      <div className="px-6 py-6">
        <div className="text-center">
          {showBackButton && (
            <Link
              href="/"
              className="inline-block text-footy-orange hover:text-white transition-colors text-sm mb-2"
            >
              ← Back to Home
            </Link>
          )}
          <h1 className="text-4xl md:text-5xl font-bold">
            <Link href="/">footy<span className="text-footy-orange">.bot</span></Link>
          </h1>
        </div>
      </div>
    </header>
  );
}
