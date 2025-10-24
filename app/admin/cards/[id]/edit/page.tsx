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

  // Form state
  const [playerName, setPlayerName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [team, setTeam] = useState('');
  const [parallelType, setParallelType] = useState('');
  const [variant, setVariant] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [isNumbered, setIsNumbered] = useState(false);
  const [printRun, setPrintRun] = useState('');
  const [hasAutograph, setHasAutograph] = useState(false);
  const [hasMemorabilia, setHasMemorabilia] = useState(false);
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
        setPlayerName(data.playerName || '');
        setCardNumber(data.cardNumber || '');
        setTeam(data.team || '');
        setParallelType(data.parallelType || '');
        setVariant(data.variant || '');
        setSerialNumber(data.serialNumber || '');
        setIsNumbered(data.isNumbered || false);
        setPrintRun(data.printRun?.toString() || '');
        setHasAutograph(data.hasAutograph || false);
        setHasMemorabilia(data.hasMemorabilia || false);
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
      // Prepare update data
      const updateData: any = {
        playerName: playerName || null,
        cardNumber: cardNumber || null,
        team: team || null,
        parallelType: parallelType || null,
        variant: variant || null,
        serialNumber: serialNumber || null,
        isNumbered,
        printRun: printRun ? parseInt(printRun) : null,
        hasAutograph,
        hasMemorabilia,
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

  const submitUpdate = async (updateData: any) => {
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

          {/* Card Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Card Details
            </h2>

            <div className="space-y-4">
              {/* Player Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Player Name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Team
                </label>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Parallel Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parallel Type
                </label>
                <input
                  type="text"
                  value={parallelType}
                  onChange={(e) => setParallelType(e.target.value)}
                  placeholder="e.g., Gold, Silver, Base"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Variant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Variant
                </label>
                <input
                  type="text"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  placeholder="e.g., Refractor, Chrome"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasAutograph}
                    onChange={(e) => setHasAutograph(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Autograph</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasMemorabilia}
                    onChange={(e) => setHasMemorabilia(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Memorabilia</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isNumbered}
                    onChange={(e) => setIsNumbered(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Numbered</span>
                </label>
              </div>

              {/* Serial Number & Print Run */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g., 15/99"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Print Run
                  </label>
                  <input
                    type="number"
                    value={printRun}
                    onChange={(e) => setPrintRun(e.target.value)}
                    placeholder="e.g., 99"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footy Notes - Full Width */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Footy Notes
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
