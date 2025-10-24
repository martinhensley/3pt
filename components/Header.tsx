"use client";

import Link from "next/link";

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = false }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-footy-green to-green-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-6">
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
