'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

interface Card {
  id: string;
  playerName: string | null;
  cardNumber: string | null;
  team: string | null;
  parallelType: string | null;
  variant: string | null;
  serialNumber: string | null;
  isNumbered: boolean;
  printRun: number | null;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  rarity: string | null;
  finish: string | null;
  colorVariant: string | null;
  specialFeatures: string[];
  imageFront: string | null;
  imageBack: string | null;
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

export default function EditCardPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Only editable fields
  const [footyNotes, setFootyNotes] = useState('');

  // Image uploads
  const [newFrontImage, setNewFrontImage] = useState<File | null>(null);
  const [newBackImage, setNewBackImage] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);

  // Load card data
  useEffect(() => {
    fetch(`/api/cards/${cardId}`)
      .then((res) => res.json())
      .then((data) => {
        setCard(data);
        setFootyNotes(data.footyNotes || '');
        setFrontImagePreview(data.imageFront);
        setBackImagePreview(data.imageBack);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load card:', err);
        setLoading(false);
      });
  }, [cardId]);

  // Handle image file selection
  const handleFrontImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewFrontImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewBackImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save card
  const handleSave = async () => {
    setSaving(true);

    try {
      // Only send editable fields
      const updateData: {
        footyNotes: string | null;
        imageFront?: string;
        imageBack?: string;
      } = {
        footyNotes: footyNotes || null,
      };

      // If there are new images, convert and add them
      if (newFrontImage) {
        const frontReader = new FileReader();
        frontReader.onloadend = async () => {
          updateData.imageFront = frontReader.result;

          if (newBackImage) {
            const backReader = new FileReader();
            backReader.onloadend = async () => {
              updateData.imageBack = backReader.result;
              await submitUpdate(updateData);
            };
            backReader.readAsDataURL(newBackImage);
          } else {
            await submitUpdate(updateData);
          }
        };
        frontReader.readAsDataURL(newFrontImage);
      } else if (newBackImage) {
        const backReader = new FileReader();
        backReader.onloadend = async () => {
          updateData.imageBack = backReader.result;
          await submitUpdate(updateData);
        };
        backReader.readAsDataURL(newBackImage);
      } else {
        await submitUpdate(updateData);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save card');
      setSaving(false);
    }
  };

  const submitUpdate = async (updateData: {
    footyNotes: string | null;
    imageFront?: string;
    imageBack?: string;
  }) => {
    const response = await fetch(`/api/admin/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      alert('Card updated successfully!');
      router.push('/admin/cards');
    } else {
      const error = await response.json();
      alert(`Failed to update card: ${error.error || 'Unknown error'}`);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-600 dark:text-gray-300">Loading card...</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Card Not Found
            </h1>
            <Link
              href="/admin/cards"
              className="text-footy-green dark:text-footy-orange hover:underline"
            >
              ← Back to Cards
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-footy-green dark:text-footy-orange mb-2">
              Edit Card
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {card.set.release.year} {card.set.release.manufacturer.name}{' '}
              {card.set.release.name} - {card.set.name}
            </p>
          </div>
          <Link
            href="/admin/cards"
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            ← Back to Cards
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Card Images */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Card Images
            </h2>

            {/* Front Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Front Image
              </label>
              {frontImagePreview && (
                <div className="mb-3 relative w-full aspect-[2.5/3.5] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <Image
                    src={frontImagePreview}
                    alt="Front preview"
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFrontImageChange}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Back Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Back Image
              </label>
              {backImagePreview && (
                <div className="mb-3 relative w-full aspect-[2.5/3.5] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <Image
                    src={backImagePreview}
                    alt="Back preview"
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleBackImageChange}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Card Details (Read-only) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Card Details
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                (inherited from checklist)
              </span>
            </h2>

            <div className="space-y-4">
              {/* Player Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player Name
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                  {card.playerName || '—'}
                </div>
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Card Number
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                  {card.cardNumber || '—'}
                </div>
              </div>

              {/* Team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                  {card.team || '—'}
                </div>
              </div>

              {/* Parallel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parallel Type
                </label>
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                  {card.parallelType || 'Base'}
                </div>
              </div>

              {/* Serial Number & Print Run */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Serial Number
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                    {card.serialNumber || '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Print Run
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300">
                    {card.printRun ? `/${card.printRun}` : '—'}
                  </div>
                </div>
              </div>

              {/* Special Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Special Features
                </label>
                <div className="flex gap-2 flex-wrap">
                  {card.hasAutograph && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                      Autograph
                    </span>
                  )}
                  {card.hasMemorabilia && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                      Memorabilia
                    </span>
                  )}
                  {card.isNumbered && (
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-sm rounded-full">
                      Numbered
                    </span>
                  )}
                  {!card.hasAutograph && !card.hasMemorabilia && !card.isNumbered && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* footy notes - Full Width */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              footy notes
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Internal notes about this card (not visible to public)
            </p>
            <textarea
              value={footyNotes}
              onChange={(e) => setFootyNotes(e.target.value)}
              rows={6}
              placeholder="Add any notes about this card..."
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex gap-4 justify-end">
          <Link
            href="/admin/cards"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-footy-green to-green-700 dark:from-footy-orange dark:to-orange-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
