"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EbayAd from "@/components/EbayAd";
import EbayAdHorizontal from "@/components/EbayAdHorizontal";
import { useEffect, useState } from "react";

interface Manufacturer {
  id: string;
  name: string;
}

interface Release {
  id: string;
  name: string;
  year: string | null;
  manufacturer: Manufacturer;
}

interface SetWithRelease {
  id: string;
  name: string;
  slug: string;
  type: string;
  release: {
    id: string;
    name: string;
    year: string | null;
    manufacturer: {
      id: string;
      name: string;
    };
  };
  _count: {
    cards: number;
  };
}

export default function ChecklistsPage() {
  const [sets, setSets] = useState<SetWithRelease[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState("");
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedRelease, setSelectedRelease] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Fetch filter options on mount
  useEffect(() => {
    fetch("/api/checklists/filters")
      .then((res) => res.json())
      .then((data) => {
        setManufacturers(data.manufacturers || []);
        setReleases(data.releases || []);
      })
      .catch((error) => {
        console.error("Failed to fetch filter options:", error);
      });
  }, []);

  // Fetch sets when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (selectedManufacturer) params.append("manufacturer", selectedManufacturer);
    if (selectedRelease) params.append("release", selectedRelease);
    if (selectedType) params.append("type", selectedType);

    setLoading(true);
    fetch(`/api/checklists?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setSets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch checklists:", error);
        setSets([]);
        setLoading(false);
      });
  }, [search, selectedManufacturer, selectedRelease, selectedType]);

  // Filter releases based on selected manufacturer
  const filteredReleases = selectedManufacturer
    ? releases.filter((r) => r.manufacturer.id === selectedManufacturer)
    : releases;

  // Get set type badge color
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "Base":
        return "bg-cyan-100 text-cyan-800";
      case "Insert":
        return "bg-yellow-100 text-yellow-800";
      case "Autograph":
        return "bg-red-100 text-red-800";
      case "Memorabilia":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="flex-grow flex gap-4 max-w-[1600px] mx-auto w-full px-4 pt-6 pb-12">
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="basketball cards checklist" limit={3} title="Card Checklists" />
        </aside>

        <main className="flex-grow max-w-5xl lg:mx-auto space-y-6">
          <Header rounded={true} />

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-footy-green mb-2">
              Set Checklists
            </h1>
            <p className="text-gray-600">
              Browse all basketball card set checklists to find the cards you need to chase
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Checklists</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search set names..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
              />

              {/* Manufacturer filter */}
              <select
                value={selectedManufacturer}
                onChange={(e) => {
                  setSelectedManufacturer(e.target.value);
                  setSelectedRelease(""); // Reset release when manufacturer changes
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
              >
                <option value="">All Manufacturers</option>
                {manufacturers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {/* Release filter */}
              <select
                value={selectedRelease}
                onChange={(e) => setSelectedRelease(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
              >
                <option value="">All Releases</option>
                {filteredReleases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.year} {r.manufacturer.name} {r.name}
                  </option>
                ))}
              </select>

              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-footy-green"
              >
                <option value="">All Types</option>
                <option value="Base">Base</option>
                <option value="Insert">Insert</option>
                <option value="Autograph">Autograph</option>
                <option value="Memorabilia">Memorabilia</option>
              </select>
            </div>

            {/* Clear filters button */}
            {(search || selectedManufacturer || selectedRelease || selectedType) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedManufacturer("");
                  setSelectedRelease("");
                  setSelectedType("");
                }}
                className="mt-4 text-footy-green hover:text-green-700 font-semibold text-sm"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            </div>
          ) : (
            <>
              {sets.length === 0 ? (
                <div className="text-center py-20">
                  <div className="bg-white rounded-2xl shadow-lg p-12 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-footy-green mb-4">
                      No Checklists Found
                    </h2>
                    <p className="text-gray-600">
                      Try adjusting your filters to see more results
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Results count */}
                  <div className="text-sm text-gray-600 mb-4">
                    Showing {sets.length} {sets.length === 1 ? "checklist" : "checklists"}
                  </div>

                  {/* Checklists table */}
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Set Name
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Release
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Cards
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {sets.map((set) => (
                            <tr key={set.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">{set.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-600">
                                  {set.release.year} {set.release.manufacturer.name} {set.release.name}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeBadgeColor(set.type)}`}>
                                  {set.type}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-600">{set._count.cards}</div>
                              </td>
                              <td className="px-6 py-4">
                                <Link
                                  href={`/sets/${set.slug}`}
                                  className="text-footy-orange hover:text-orange-600 font-semibold text-sm transition-colors"
                                >
                                  View Checklist →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              <EbayAdHorizontal query="soccer trading cards" limit={4} title="More Soccer Cards" />

              <Footer rounded={true} />
            </>
          )}
        </main>

        <aside className="hidden lg:block w-72 flex-shrink-0">
          <EbayAd query="soccer memorabilia" limit={3} title="Soccer Memorabilia" />
        </aside>
      </div>
    </div>
  );
}
