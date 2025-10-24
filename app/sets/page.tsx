"use client";

import Link from "next/link";
import Header from "@/components/Header";
import { useEffect, useState } from "react";

interface Set {
  id: string;
  name: string;
  slug: string;
  totalCards: string | null;
  parallels: string[] | null;
  createdAt: string;
  release: {
    id: string;
    name: string;
    year: string | null;
    slug: string;
    manufacturer: {
      name: string;
    };
  };
  _count: {
    cards: number;
  };
}

export default function SetsIndex() {
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sets")
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is an array
        setSets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch sets:", error);
        setSets([]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header />

      <div className="flex-grow max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-footy-green dark:text-footy-orange mb-2">
            All Sets
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse our complete collection of soccer card sets
          </p>
        </div>

        {sets.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 max-w-2xl mx-auto transition-colors duration-300">
              <h2 className="text-3xl font-bold text-footy-green dark:text-footy-orange mb-4">
                No Sets Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Check back soon for the latest soccer card sets!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => {
              // Normalize "Base Optic" to "Optic Base"
              const displayName = set.name.toLowerCase() === 'base optic' ? 'Optic Base' : set.name;
              const title = `${set.release.year || ''} ${set.release.manufacturer.name} ${set.release.name} ${displayName}`.trim();
              const cardCount = set._count?.cards || (set.totalCards ? parseInt(set.totalCards) : 0);
              const parallelCount = Array.isArray(set.parallels) ? set.parallels.length : 0;

              return (
                <Link
                  key={set.id}
                  href={`/sets/${set.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-200 dark:border-gray-700"
                >
                  <div className="bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 p-6 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full font-semibold text-xs uppercase">
                        Set
                      </span>
                    </div>
                    <h2 className="font-bold text-xl line-clamp-2 mb-2">
                      {title}
                    </h2>
                    <p className="text-sm text-white/80 line-clamp-1">
                      {set.release.manufacturer.name} {set.release.year}
                    </p>
                  </div>

                  <div className="p-6 flex-grow flex flex-col">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Cards
                        </div>
                        <div className="text-2xl font-black text-footy-green dark:text-footy-orange">
                          {cardCount > 0 ? cardCount.toLocaleString() : '—'}
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Parallels
                        </div>
                        <div className="text-2xl font-black text-footy-green dark:text-footy-orange">
                          {parallelCount > 0 ? parallelCount : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-footy-orange dark:text-footy-orange font-semibold flex items-center gap-2">
                        View checklist →
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <footer className="bg-footy-green dark:bg-gray-950 text-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-sm">
              <span className="text-white">footy</span><span className="text-footy-orange">.bot</span> © 2024-{new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
