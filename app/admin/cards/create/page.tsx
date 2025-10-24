'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Release {
  id: string;
  name: string;
  year: string;
  manufacturer: {
    name: string;
  };
  sets: Set[];
}

interface Set {
  id: string;
  name: string;
  parallels: Parallel[];
}

interface Parallel {
  id: string;
  name: string;
}

interface ScannedCard {
  frontImage: string;
  backImage?: string;
  playerName: string;
  cardNumber: string;
  team?: string;
  hasAutograph: boolean;
  hasMemorabilia: boolean;
  isNumbered: boolean;
  serialNumber?: string;
  printRun?: number;
  confidence: number;
  setId?: string;
  setName?: string;
  parallelId?: string | null;
  parallelName?: string | null;
  identifyConfidence?: number;
  status: 'pending' | 'identifying' | 'scanning' | 'scanned' | 'saved' | 'error';
  error?: string;
}

/**
 * Convert image to JPEG via API
 */
async function convertImageToJpeg(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/convert-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to convert image');
  }

  const { dataUri } = await response.json();
  return dataUri;
}

export default function CreateCardPage() {
  const router = useRouter();

  // Release selection
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);

  // Workflow mode
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  // Images
  const [frontImages, setFrontImages] = useState<File[]>([]);
  const [backImages, setBackImages] = useState<File[]>([]);
  const [scannedCards, setScannedCards] = useState<ScannedCard[]>([]);

  // Progress
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: '' });

  // Load releases on mount
  useEffect(() => {
    fetch('/api/releases')
      .then((res) => res.json())
      .then((data) => setReleases(data))
      .catch((err) => console.error('Failed to load releases:', err));
  }, []);

  // Update selected release
  const handleReleaseChange = useCallback((releaseId: string) => {
    setSelectedReleaseId(releaseId);
    const release = releases.find((r) => r.id === releaseId);
    setSelectedRelease(release || null);
    setScannedCards([]);
  }, [releases]);

  // Handle front image upload
  const handleFrontImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFrontImages(files);
    setScannedCards([]);
  }, []);

  // Handle back image upload
  const handleBackImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBackImages(files);
  }, []);

  // Process all cards with AI
  const handleProcessCards = useCallback(async () => {
    if (!selectedReleaseId || !selectedRelease || frontImages.length === 0) {
      alert('Please select a release and upload front images');
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: frontImages.length * 2, step: 'Starting...' });

    const processed: ScannedCard[] = [];

    for (let i = 0; i < frontImages.length; i++) {
      const frontFile = frontImages[i];
      const backFile = backImages[i]; // May be undefined

      try {
        // Step 1: Convert images
        setProgress({ current: i * 2, total: frontImages.length * 2, step: `Converting image ${i + 1}...` });
        const frontImage = await convertImageToJpeg(frontFile);
        const backImage = backFile ? await convertImageToJpeg(backFile) : undefined;

        // Step 2: Identify set and parallel using AI
        setProgress({ current: i * 2 + 1, total: frontImages.length * 2, step: `Identifying card ${i + 1}...` });
        const identifyResponse = await fetch('/api/admin/identify-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frontImage,
            backImage,
            releaseId: selectedReleaseId,
          }),
        });

        const identifyResult = await identifyResponse.json();

        if (!identifyResult.success) {
          processed.push({
            frontImage,
            backImage,
            playerName: '',
            cardNumber: '',
            hasAutograph: false,
            hasMemorabilia: false,
            isNumbered: false,
            confidence: 0,
            status: 'error',
            error: `Failed to identify: ${identifyResult.error || 'Unknown error'}`,
          });
          continue;
        }

        const { data: identification } = identifyResult;

        // Step 3: Scan card details using identified context
        setProgress({ current: i * 2 + 2, total: frontImages.length * 2, step: `Scanning card ${i + 1}...` });

        // Find matched set or use first available
        const matchedSet = selectedRelease.sets.find(
          (s) => s.id === identification.matchedSetId
        ) || selectedRelease.sets[0];

        if (!matchedSet) {
          processed.push({
            frontImage,
            backImage,
            playerName: '',
            cardNumber: '',
            hasAutograph: false,
            hasMemorabilia: false,
            isNumbered: false,
            confidence: 0,
            setId: undefined,
            setName: identification.setName,
            parallelName: identification.parallelName,
            status: 'error',
            error: 'No sets found in release',
          });
          continue;
        }

        // Find matched parallel
        const matchedParallel = matchedSet.parallels.find(
          (p) => p.id === identification.matchedParallelId
        );

        // Prepare context for detailed scan
        const scanContext = {
          release: {
            name: selectedRelease.name,
            year: selectedRelease.year,
            manufacturer: selectedRelease.manufacturer.name,
          },
          set: {
            name: matchedSet.name,
          },
          parallel: matchedParallel ? {
            name: matchedParallel.name,
          } : identification.parallelName ? {
            name: identification.parallelName,
          } : undefined,
        };

        const scanResponse = await fetch('/api/admin/scan-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frontImage,
            backImage,
            context: scanContext,
          }),
        });

        const scanResult = await scanResponse.json();

        if (scanResult.success) {
          processed.push({
            frontImage,
            backImage,
            ...scanResult.data,
            setId: matchedSet.id,
            setName: matchedSet.name,
            parallelId: matchedParallel?.id || null,
            parallelName: matchedParallel?.name || identification.parallelName,
            identifyConfidence: identification.confidence,
            status: 'scanned',
          });
        } else {
          processed.push({
            frontImage,
            backImage,
            playerName: '',
            cardNumber: '',
            hasAutograph: false,
            hasMemorabilia: false,
            isNumbered: false,
            confidence: 0,
            setId: matchedSet.id,
            setName: matchedSet.name,
            parallelId: matchedParallel?.id,
            parallelName: matchedParallel?.name || identification.parallelName,
            status: 'error',
            error: scanResult.error || 'Failed to scan',
          });
        }
      } catch (error) {
        console.error('Process error:', error);
        processed.push({
          frontImage: '',
          playerName: '',
          cardNumber: '',
          hasAutograph: false,
          hasMemorabilia: false,
          isNumbered: false,
          confidence: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setScannedCards(processed);
    setIsProcessing(false);
    setProgress({ current: 0, total: 0, step: '' });
  }, [selectedReleaseId, selectedRelease, frontImages, backImages]);

  // Update card field
  const handleUpdateCard = useCallback((index: number, field: string, value: string | boolean | number) => {
    setScannedCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  // Save all cards
  const handleSaveCards = useCallback(async () => {
    if (scannedCards.length === 0) {
      alert('No cards to save');
      return;
    }

    // Validate all cards have required fields
    const invalid = scannedCards.filter(
      (card) => !card.setId || !card.playerName || !card.cardNumber
    );

    if (invalid.length > 0) {
      alert(`${invalid.length} card(s) missing required fields (Set, Player Name, Card Number)`);
      return;
    }

    setIsSaving(true);

    try {
      const cardsToSave = scannedCards.map((card) => ({
        setId: card.setId!,
        parallelId: card.parallelId || undefined,
        playerName: card.playerName,
        cardNumber: card.cardNumber,
        team: card.team,
        hasAutograph: card.hasAutograph,
        hasMemorabilia: card.hasMemorabilia,
        isNumbered: card.isNumbered,
        serialNumber: card.serialNumber,
        printRun: card.printRun,
        frontImage: card.frontImage,
        backImage: card.backImage,
      }));

      const response = await fetch('/api/admin/bulk-save-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: cardsToSave }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Successfully saved ${result.succeeded} card(s)!`);

        // Navigate to the first set
        if (scannedCards[0]?.setId) {
          const firstSet = selectedRelease?.sets.find(s => s.id === scannedCards[0].setId);
          if (firstSet) {
            const setSlug = `${selectedRelease?.year || ''}-${selectedRelease?.name}-${firstSet.name}`
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '');
            router.push(`/sets/${setSlug}`);
          } else {
            router.push('/admin');
          }
        } else {
          router.push('/admin');
        }
      } else {
        alert(`Failed to save cards: ${result.message || 'Unknown error'}\n${result.failed} failed.`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save cards');
    } finally {
      setIsSaving(false);
    }
  }, [scannedCards, selectedRelease, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-footy-green dark:text-footy-orange">
            Create Cards
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered card scanning and cataloging
          </p>
        </div>

        {/* Step 1: Select Release */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <span className="bg-footy-green text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Select Release
          </h2>

          <select
            value={selectedReleaseId}
            onChange={(e) => handleReleaseChange(e.target.value)}
            className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
          >
            <option value="">Choose a release...</option>
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.year} {release.manufacturer.name} {release.name}
              </option>
            ))}
          </select>

          {selectedRelease && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Available Sets:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedRelease.sets.map((set) => (
                  <span
                    key={set.id}
                    className="px-3 py-1 bg-footy-green/10 text-footy-green dark:bg-footy-orange/10 dark:text-footy-orange rounded-full text-sm"
                  >
                    {set.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Upload Images */}
        {selectedReleaseId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="bg-footy-green text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                2
              </span>
              Upload Card Images
            </h2>

            {/* Mode Selection */}
            <div className="mb-4">
              <div className="flex gap-4">
                <button
                  onClick={() => setMode('single')}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    mode === 'single'
                      ? 'bg-footy-green text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Single Card
                </button>
                <button
                  onClick={() => setMode('bulk')}
                  className={`px-4 py-2 rounded-lg font-semibold ${
                    mode === 'bulk'
                      ? 'bg-footy-green text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Bulk Upload
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Images */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Front Images (Required)
                </label>
                <input
                  type="file"
                  multiple={mode === 'bulk'}
                  accept="image/*"
                  onChange={handleFrontImagesChange}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {frontImages.length} file(s) selected
                </p>
              </div>

              {/* Back Images */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Back Images (Optional)
                </label>
                <input
                  type="file"
                  multiple={mode === 'bulk'}
                  accept="image/*"
                  onChange={handleBackImagesChange}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {backImages.length} file(s) selected
                </p>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcessCards}
              disabled={frontImages.length === 0 || isProcessing}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-footy-green to-green-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {progress.step} ({progress.current}/{progress.total})
                </span>
              ) : (
                `Analyze ${frontImages.length} Card(s) with AI`
              )}
            </button>
          </div>
        )}

        {/* Step 3: Review & Save */}
        {scannedCards.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="bg-footy-green text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                3
              </span>
              Review & Save ({scannedCards.length} cards)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 dark:border-gray-700">
                    <th className="text-left p-2 text-gray-900 dark:text-white">Card #</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Player</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Set</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Parallel</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Team</th>
                    <th className="text-center p-2 text-gray-900 dark:text-white">Auto</th>
                    <th className="text-center p-2 text-gray-900 dark:text-white">Mem</th>
                    <th className="text-left p-2 text-gray-900 dark:text-white">Serial</th>
                    <th className="text-center p-2 text-gray-900 dark:text-white">Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedCards.map((card, idx) => (
                    <tr key={idx} className="border-b dark:border-gray-700">
                      <td className="p-2">
                        <input
                          type="text"
                          value={card.cardNumber}
                          onChange={(e) => handleUpdateCard(idx, 'cardNumber', e.target.value)}
                          className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={card.playerName}
                          onChange={(e) => handleUpdateCard(idx, 'playerName', e.target.value)}
                          className="w-40 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={card.setId || ''}
                          onChange={(e) => handleUpdateCard(idx, 'setId', e.target.value)}
                          className="w-32 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        >
                          <option value="">Select...</option>
                          {selectedRelease?.sets.map((set) => (
                            <option key={set.id} value={set.id}>
                              {set.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-sm text-gray-700 dark:text-gray-300">
                        {card.parallelName || 'Base'}
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={card.team || ''}
                          onChange={(e) => handleUpdateCard(idx, 'team', e.target.value)}
                          className="w-28 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={card.hasAutograph}
                          onChange={(e) => handleUpdateCard(idx, 'hasAutograph', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={card.hasMemorabilia}
                          onChange={(e) => handleUpdateCard(idx, 'hasMemorabilia', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={card.serialNumber || ''}
                          onChange={(e) => handleUpdateCard(idx, 'serialNumber', e.target.value)}
                          placeholder="e.g., 15/99"
                          className="w-20 p-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-sm font-semibold ${
                            card.confidence >= 70
                              ? 'text-green-600 dark:text-green-400'
                              : card.confidence >= 50
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {card.confidence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={handleSaveCards}
                disabled={isSaving}
                className="px-6 py-3 bg-gradient-to-r from-footy-orange to-orange-700 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? 'Saving...' : `Save ${scannedCards.length} Card(s)`}
              </button>

              <button
                onClick={() => {
                  setScannedCards([]);
                  setFrontImages([]);
                  setBackImages([]);
                }}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
