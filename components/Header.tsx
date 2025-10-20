"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderProps {
  showBackButton?: boolean;
}

export default function Header({ showBackButton = false }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { theme, toggleTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
    setSearchOpen(false);
  };

  return (
    <>
      <header className="bg-footy-dark-green dark:bg-gray-950 text-white shadow-lg relative transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex-1"></div>

          <div className="text-center">
            {showBackButton && (
              <Link
                href="/"
                className="inline-block text-footy-gold hover:text-white transition-colors text-sm mb-2"
              >
                ← Back to Home
              </Link>
            )}
            <h1 className="text-4xl md:text-5xl font-bold">
              <Link href="/">footy limited</Link>
            </h1>
          </div>

          <div className="flex-1 flex items-center gap-3 justify-end">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-footy-gold hover:text-footy-dark-green rounded transition-colors"
              title="Search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-footy-gold hover:text-footy-dark-green rounded transition-colors"
              title="Toggle Dark Mode"
            >
              {theme === "dark" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-footy-dark-green dark:bg-gray-950 border-t-2 border-footy-gold shadow-xl z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="flex-grow px-4 py-2 rounded bg-white dark:bg-gray-800 text-footy-dark-green dark:text-white focus:outline-none focus:ring-2 focus:ring-footy-gold"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-footy-gold text-footy-dark-green font-semibold rounded hover:opacity-90 transition-opacity"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="px-4 py-2 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Overlay when search is open */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSearchOpen(false)}
        />
      )}
    </>
  );
}
