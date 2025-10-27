'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import Breadcrumb from '@/components/Breadcrumb';

interface Card {
  id: string;
  playerName: string | null;
  cardNumber: string | null;
  team: string | null;
  parallelType: string | null;
  variant: string | null;
  imageFront: string | null;
  imageBack: string | null;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  isNumbered: boolean;
  printRun: number | null;
  footyNotes: string | null;
  set: {
    id: string;
    name: string;
    release: {
      id: string;
      name: string;
      year: string | null;
      manufacturer: {
        name: string;
      };
    };
  };
}

interface Release {
  id: string;
  name: string;
  year: string | null;
  manufacturer: {
    name: string;
  };
}

export default function AdminCardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRelease, setSelectedRelease] = useState('');
  const [hasImages, setHasImages] = useState<'all' | 'yes' | 'no'>('all');
  const [hasNotes, setHasNotes] = useState<'all' | 'yes' | 'no'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 50;

  // Load cards and releases
  useEffect(() => {
    Promise.all([
      fetch('/api/cards/all').then((res) => res.json()),
      fetch('/api/releases').then((res) => res.json()),
    ])
      .then(([cardsData, releasesData]) => {
        setCards(cardsData);
        setFilteredCards(cardsData);
        setReleases(releasesData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...cards];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.playerName?.toLowerCase().includes(query) ||
          card.cardNumber?.toLowerCase().includes(query) ||
          card.team?.toLowerCase().includes(query) ||
          card.set.name.toLowerCase().includes(query) ||
          card.set.release.name.toLowerCase().includes(query)
      );
    }

    // Release filter
    if (selectedRelease) {
      filtered = filtered.filter((card) => card.set.release.id === selectedRelease);
    }

    // Images filter
    if (hasImages === 'yes') {
      filtered = filtered.filter((card) => card.imageFront || card.imageBack);
    } else if (hasImages === 'no') {
      filtered = filtered.filter((card) => !card.imageFront && !card.imageBack);
    }

    // Notes filter
    if (hasNotes === 'yes') {
      filtered = filtered.filter((card) => card.footyNotes);
    } else if (hasNotes === 'no') {
      filtered = filtered.filter((card) => !card.footyNotes);
    }

    setFilteredCards(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedRelease, hasImages, hasNotes, cards]);

  // Pagination
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
  const currentCards = filteredCards.slice(startIndex, endIndex);

  if (loading) {
    return (
      <AdminLayout maxWidth="7xl">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600">Loading cards...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout maxWidth="7xl">
      {/* Header */}
      <div className="mb-8">
        <Breadcrumb
          items={[
            { label: "Admin", href: "/admin" },
            { label: "Cards", href: "/admin/cards" },
          ]}
        />

        <div className="flex items-center justify-between mt-6">
          <div>
            <h1 className="text-3xl font-bold text-footy-green mb-2">
              Manage Card Images
            </h1>
            <p className="text-gray-600">
              View and edit card details, add images, and manage notes
            </p>
          </div>
        </div>
      </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Player, card #, team, set..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Release */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release
              </label>
              <select
                value={selectedRelease}
                onChange={(e) => setSelectedRelease(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">All Releases</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.year} {release.manufacturer.name} {release.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Has Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <select
                value={hasImages}
                onChange={(e) => setHasImages(e.target.value as 'all' | 'yes' | 'no')}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All Cards</option>
                <option value="yes">With Images</option>
                <option value="no">Without Images</option>
              </select>
            </div>

            {/* Has Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <select
                value={hasNotes}
                onChange={(e) => setHasNotes(e.target.value as 'all' | 'yes' | 'no')}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All Cards</option>
                <option value="yes">With Notes</option>
                <option value="no">Without Notes</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {currentCards.length} of {filteredCards.length} cards
            {filteredCards.length !== cards.length && ` (${cards.length} total)`}
          </div>
        </div>

        {/* Cards Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Card #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Player
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Team
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Set / Release
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Parallel
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Features
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Notes
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentCards.map((card) => (
                  <tr
                    key={card.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Image */}
                    <td className="px-4 py-3">
                      {card.imageFront ? (
                        <div className="w-12 h-16 relative bg-gray-200 rounded">
                          <Image
                            src={card.imageFront}
                            alt={card.playerName || 'Card'}
                            fill
                            className="object-contain rounded"
                            sizes="48px"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                          No Image
                        </div>
                      )}
                    </td>

                    {/* Card Number */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {card.cardNumber || '—'}
                    </td>

                    {/* Player */}
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {card.playerName || '—'}
                    </td>

                    {/* Team */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {card.team || '—'}
                    </td>

                    {/* Set / Release */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{card.set.name}</div>
                      <div className="text-xs text-gray-500">
                        {card.set.release.year} {card.set.release.name}
                      </div>
                    </td>

                    {/* Parallel */}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {card.parallelType || card.variant || 'Base'}
                    </td>

                    {/* Features */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {card.hasAutograph && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            AUTO
                          </span>
                        )}
                        {card.hasMemorabilia && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            MEM
                          </span>
                        )}
                        {card.isNumbered && card.printRun && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                            /{card.printRun}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 text-center">
                      {card.footyNotes ? (
                        <span className="inline-flex items-center px-2 py-1 bg-footy-green/10 text-footy-green text-xs rounded">
                          Has Notes
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => router.push(`/admin/cards/${card.id}/edit`)}
                        className="px-3 py-1 bg-footy-green text-white text-sm rounded hover:shadow-lg transition-all"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {filteredCards.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 text-lg">
              No cards found matching your filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedRelease('');
                setHasImages('all');
                setHasNotes('all');
              }}
              className="mt-4 px-4 py-2 bg-footy-green text-white rounded-lg hover:shadow-lg transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
    </AdminLayout>
  );
}
