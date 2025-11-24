'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface Release {
  id: string;
  name: string;
  year: string;
  manufacturer: {
    name: string;
  };
}

interface Set {
  id: string;
  name: string;
  releaseId: string;
}

interface Parallel {
  id: string;
  name: string;
  setId: string;
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
  status: 'pending' | 'scanning' | 'scanned' | 'saved' | 'error';
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

export default function BulkScanPage() {
  const router = useRouter();

  // Context selection
  const [releases, setReleases] = useState<Release[]>([]);
  const [sets, setSets] = useState<Set[]>([]);
  const [parallels, setParallels] = useState<Parallel[]>([]);

  const [selectedReleaseId, setSelectedReleaseId] = useState('');
  const [selectedSetId, setSelectedSetId] = useState('');
  const [selectedParallelId, setSelectedParallelId] = useState('');

  // Images and scanning
  const [frontImages, setFrontImages] = useState<File[]>([]);
  const [backImages, setBackImages] = useState<File[]>([]);
  const [scannedCards, setScannedCards] = useState<ScannedCard[]>([]);

  // Progress
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  // Load releases on mount
  useEffect(() => {
    fetch('/api/admin/releases')
      .then((res) => res.json())
      .then((data) => setReleases(data))
      .catch((err) => console.error('Failed to load releases:', err));
  }, []);

  // Load sets when release changes
  const handleReleaseChange = useCallback((releaseId: string) => {
    setSelectedReleaseId(releaseId);
    setSelectedSetId('');
    setSelectedParallelId('');
    setSets([]);
    setParallels([]);

    if (!releaseId) return;

    fetch(`/api/admin/sets?releaseId=${releaseId}`)
      .then((res) => res.json())
      .then((data) => setSets(data))
      .catch((err) => console.error('Failed to load sets:', err));
  }, []);

  // Load parallels when set changes
  const handleSetChange = useCallback((setId: string) => {
    setSelectedSetId(setId);
    setSelectedParallelId('');
    setParallels([]);

    if (!setId) return;

    fetch(`/api/admin/parallels?setId=${setId}`)
      .then((res) => res.json())
      .then((data) => setParallels(data))
      .catch((err) => console.error('Failed to load parallels:', err));
  }, []);

  // Handle front image upload
  const handleFrontImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFrontImages(files);
  }, []);

  // Handle back image upload
  const handleBackImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setBackImages(files);
  }, []);

  // Scan all cards
  const handleScanCards = useCallback(async () => {
    if (!selectedReleaseId || !selectedSetId || frontImages.length === 0) {
      alert('Please select release, set, and upload front images');
      return;
    }

    setIsScanning(true);
    setScanProgress({ current: 0, total: frontImages.length });

    const scanned: ScannedCard[] = [];

    // Get context information
    const release = releases.find((r) => r.id === selectedReleaseId);
    const set = sets.find((s) => s.id === selectedSetId);
    const parallel = parallels.find((p) => p.id === selectedParallelId);

    if (!release || !set) {
      alert('Failed to load context information');
      setIsScanning(false);
      return;
    }

    // Process each image
    for (let i = 0; i < frontImages.length; i++) {
      const frontFile = frontImages[i];
      const backFile = backImages[i]; // May be undefined

      try {
        // Convert images to JPEG
        const frontImage = await convertImageToJpeg(frontFile);
        const backImage = backFile ? await convertImageToJpeg(backFile) : undefined;

        // Prepare context
        const context = {
          release: {
            name: release.name,
            year: release.year,
            manufacturer: release.manufacturer.name,
          },
          set: {
            name: set.name,
          },
          parallel: parallel ? {
            name: parallel.name,
          } : undefined,
        };

        // Call scan API
        const response = await fetch('/api/admin/scan-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            frontImage,
            backImage,
            context,
          }),
        });

        const result = await response.json();

        if (result.success) {
          scanned.push({
            frontImage,
            backImage,
            ...result.data,
            status: 'scanned',
          });
        } else {
          scanned.push({
            frontImage,
            backImage,
            playerName: '',
            cardNumber: '',
            hasAutograph: false,
            hasMemorabilia: false,
            isNumbered: false,
            confidence: 0,
            status: 'error',
            error: result.error || 'Failed to scan',
          });
        }
      } catch (error) {
        console.error('Scan error:', error);
        scanned.push({
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

      setScanProgress({ current: i + 1, total: frontImages.length });
    }

    setScannedCards(scanned);
    setIsScanning(false);
  }, [selectedReleaseId, selectedSetId, selectedParallelId, frontImages, backImages, releases, sets, parallels]);

  // Save all cards
  const handleSaveCards = useCallback(async () => {
    if (!selectedSetId || scannedCards.length === 0) {
      alert('No cards to save');
      return;
    }

    setIsSaving(true);

    try {
      const cardsToSave = scannedCards.map((card) => ({
        setId: selectedSetId,
        parallelId: selectedParallelId || undefined,
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
        alert(`Saved ${result.succeeded} cards successfully!`);
        router.push(`/sets/${selectedSetId}`);
      } else {
        alert(`Failed to save cards: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save cards');
    } finally {
      setIsSaving(false);
    }
  }, [selectedSetId, selectedParallelId, scannedCards, router]);

  return (
    <AdminLayout maxWidth="6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        Bulk Card Scanning
      </h1>

        {/* Context Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            1. Select Context
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Release */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Release
              </label>
              <select
                value={selectedReleaseId}
                onChange={(e) => handleReleaseChange(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Release</option>
                {releases.map((release) => (
                  <option key={release.id} value={release.id}>
                    {release.year} {release.manufacturer.name} {release.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Set */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Set
              </label>
              <select
                value={selectedSetId}
                onChange={(e) => handleSetChange(e.target.value)}
                disabled={!selectedReleaseId}
                className="w-full p-2 border rounded disabled:opacity-50"
              >
                <option value="">Select Set</option>
                {sets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Parallel */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Parallel (Optional)
              </label>
              <select
                value={selectedParallelId}
                onChange={(e) => setSelectedParallelId(e.target.value)}
                disabled={!selectedSetId}
                className="w-full p-2 border rounded disabled:opacity-50"
              >
                <option value="">Base / No Parallel</option>
                {parallels.map((parallel) => (
                  <option key={parallel.id} value={parallel.id}>
                    {parallel.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            2. Upload Images
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Front Images */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Front Images (Required)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFrontImagesChange}
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                {frontImages.length} file(s) selected
              </p>
            </div>

            {/* Back Images */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Back Images (Optional)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleBackImagesChange}
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500 mt-1">
                {backImages.length} file(s) selected
              </p>
            </div>
          </div>

          {/* Scan Button */}
          <button
            onClick={handleScanCards}
            disabled={!selectedReleaseId || !selectedSetId || frontImages.length === 0 || isScanning}
            className="mt-4 px-6 py-3 bg-3pt-green text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? `Scanning... (${scanProgress.current}/${scanProgress.total})` : 'Scan Cards'}
          </button>
        </div>

        {/* Scanned Cards */}
        {scannedCards.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              3. Review & Save
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-gray-900">Card #</th>
                    <th className="text-left p-2 text-gray-900">Player</th>
                    <th className="text-left p-2 text-gray-900">Team</th>
                    <th className="text-left p-2 text-gray-900">Auto</th>
                    <th className="text-left p-2 text-gray-900">Mem</th>
                    <th className="text-left p-2 text-gray-900">Serial</th>
                    <th className="text-left p-2 text-gray-900">Conf</th>
                    <th className="text-left p-2 text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scannedCards.map((card, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 text-gray-900">{card.cardNumber}</td>
                      <td className="p-2 text-gray-900">{card.playerName}</td>
                      <td className="p-2 text-gray-900">{card.team || '-'}</td>
                      <td className="p-2 text-gray-900">{card.hasAutograph ? '✓' : '-'}</td>
                      <td className="p-2 text-gray-900">{card.hasMemorabilia ? '✓' : '-'}</td>
                      <td className="p-2 text-gray-900">{card.serialNumber || '-'}</td>
                      <td className="p-2 text-gray-900">{card.confidence}%</td>
                      <td className="p-2">
                        {card.status === 'scanned' && (
                          <span className="text-green-600">✓</span>
                        )}
                        {card.status === 'error' && (
                          <span className="text-orange-600" title={card.error}>
                            Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={handleSaveCards}
              disabled={isSaving}
              className="mt-4 px-6 py-3 bg-3pt-orange text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save All Cards'}
            </button>
          </div>
        )}
    </AdminLayout>
  );
}
