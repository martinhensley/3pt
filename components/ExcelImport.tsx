'use client';

import { useState, useRef, useEffect } from 'react';

interface Release {
  id: string;
  name: string;
  slug: string;
  year: string | null;
  manufacturer: {
    name: string;
  };
}

interface ExcelImportProps {
  onSuccess?: () => void;
}

interface DetectedRelease {
  year: string;
  manufacturer: string;
  releaseName: string;
  sport: string;
}

interface BaseSetPreview {
  name: string;
  type: 'Base' | 'Insert' | 'Autograph' | 'Memorabilia';
  description: string;
  parallelsCount: number;
  parallels: string[];
  cardsCount: number;
}

interface PreviewData {
  totalCards: number;
  uniqueSetNames: number;
  detectedRelease: DetectedRelease;
  baseSets: BaseSetPreview[];
}

interface ImportSummary {
  baseSetsCreated: number;
  totalSetsCreated: number;
  totalCardsCreated: number;
}

export default function ExcelImport({ onSuccess }: ExcelImportProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedReleaseId, setSelectedReleaseId] = useState<string>('');
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressSets, setProgressSets] = useState(0);
  const [progressCards, setProgressCards] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load releases on mount
  useEffect(() => {
    async function fetchReleases() {
      try {
        const response = await fetch('/api/releases');
        if (response.ok) {
          const data = await response.json();
          setReleases(data);
        }
      } catch (err) {
        console.error('Failed to load releases:', err);
      } finally {
        setLoadingReleases(false);
      }
    }
    fetchReleases();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setPreview(null);
        setImportSummary(null);
        setError(null);
      } else {
        setError('Please select an Excel file (.xls or .xlsx)');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setPreview(null);
        setImportSummary(null);
        setError(null);
      } else {
        setError('Please drop an Excel file (.xls or .xlsx)');
      }
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);
    setPreview(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Validate release is selected
      if (!selectedReleaseId) {
        setError('Please select a release first');
        setAnalyzing(false);
        return;
      }

      // Call API with dryRun=true for preview
      const response = await fetch('/api/sets/import-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: selectedReleaseId,
          fileData,
          dryRun: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.details || data.error || 'Failed to analyze file');
      } else {
        setPreview(data.preview);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAnalyzing(false);
    }
  };

  const executeImport = async (confirmOverwrite = false) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgressSets(0);
    setProgressCards(0);

    // Start simulated progress counter
    const estimatedTotalSets = preview?.uniqueSetNames || 100;
    const estimatedTotalCards = preview?.totalCards || 1000;
    const estimatedDuration = 60000; // 60 seconds estimate
    const updateInterval = 200; // Update every 200ms
    const setsPerUpdate = estimatedTotalSets / (estimatedDuration / updateInterval);
    const cardsPerUpdate = estimatedTotalCards / (estimatedDuration / updateInterval);

    const progressInterval = setInterval(() => {
      setProgressSets(prev => {
        const next = prev + setsPerUpdate;
        return next >= estimatedTotalSets ? estimatedTotalSets : next;
      });
      setProgressCards(prev => {
        const next = prev + cardsPerUpdate;
        return next >= estimatedTotalCards ? estimatedTotalCards : next;
      });
    }, updateInterval);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Validate release is selected
      if (!selectedReleaseId) {
        setError('Please select a release first');
        setLoading(false);
        return;
      }

      // Call API with dryRun=false to create everything
      const response = await fetch('/api/sets/import-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: selectedReleaseId,
          fileData,
          dryRun: false,
          confirmOverwrite,
        }),
      });

      const data = await response.json();

      // Handle conflict response
      if (response.status === 409 && data.error === 'CONFLICT') {
        clearInterval(progressInterval);
        setLoading(false);

        // Show confirmation dialog
        const conflictMessage = `⚠️ Warning: The following sets already exist and will be deleted:\n\n${
          data.conflicts.map((c: any) =>
            `• ${c.name} (${c.cardsCount} cards, ${c.parallelsCount} parallel sets)`
          ).join('\n')
        }\n\nThis will permanently delete ${
          data.conflicts.reduce((sum: number, c: any) => sum + c.cardsCount, 0)
        } existing cards.\n\nDo you want to continue?`;

        if (window.confirm(conflictMessage)) {
          // User confirmed - retry with confirmOverwrite=true
          return executeImport(true);
        } else {
          setError('Import cancelled - existing sets were not overwritten');
          return;
        }
      }

      if (!response.ok) {
        setError(data.details || data.error || 'Failed to import file');
      } else {
        // Set final counts from actual results
        clearInterval(progressInterval);
        setProgressSets(data.summary.totalSetsCreated);
        setProgressCards(data.summary.totalCardsCreated);

        setImportSummary(data.summary);
        setPreview(null);
        setFile(null);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Release Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Target Release</h3>
        {loadingReleases ? (
          <div className="text-gray-500">Loading releases...</div>
        ) : (
          <div>
            <label htmlFor="release-select" className="block text-sm font-medium text-gray-700 mb-2">
              Choose which release to import cards into:
            </label>
            <select
              id="release-select"
              value={selectedReleaseId}
              onChange={(e) => setSelectedReleaseId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-footy-green focus:border-footy-green"
            >
              <option value="">-- Select a Release --</option>
              {releases.map((release) => (
                <option key={release.id} value={release.id}>
                  {release.year} {release.manufacturer.name} {release.name}
                </option>
              ))}
            </select>
            {selectedReleaseId && (
              <div className="mt-2 text-sm text-green-700 font-medium">
                ✓ Selected: {releases.find(r => r.id === selectedReleaseId)?.name}
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Upload Area */}
      {!preview && !importSummary && selectedReleaseId && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Upload Excel Checklist</h3>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-footy-green transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="space-y-4">
            <div className="text-4xl">📊</div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {file ? file.name : 'Drop Excel file here or click to browse'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Accepts .xls and .xlsx files
              </p>
            </div>

            {file && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  analyzeFile();
                }}
                disabled={analyzing}
                className="px-6 py-2 bg-footy-green text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Analyzing with Claude...' : 'Analyze File'}
              </button>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {analyzing && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            <p className="text-gray-600">Claude is analyzing the checklist...</p>
            <p className="text-sm text-gray-500">This may take 10-30 seconds</p>
          </div>
        </div>
      )}

      {/* Preview Results */}
      {preview && !loading && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Analysis Complete</h3>
              <p className="text-sm text-gray-700 mt-1">
                Review the detected sets below before importing
              </p>
            </div>
            <button
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              ✕ Cancel
            </button>
          </div>

          {/* Detected Release */}
          <div className="bg-white rounded-lg p-4 border-2 border-green-500">
            <h4 className="font-semibold text-gray-900 mb-2">📦 Detected Release</h4>
            <div className="text-lg font-bold text-green-700">
              {preview.detectedRelease.year} {preview.detectedRelease.manufacturer} {preview.detectedRelease.releaseName}
            </div>
            <div className="text-sm text-gray-600 mt-1">Sport: {preview.detectedRelease.sport}</div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{preview.totalCards}</div>
              <div className="text-sm text-gray-600">Total Cards</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{preview.baseSets.length}</div>
              <div className="text-sm text-gray-600">Base Sets</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{preview.uniqueSetNames}</div>
              <div className="text-sm text-gray-600">Total Sets (with parallels)</div>
            </div>
          </div>

          {/* Base Sets Table */}
          <div className="bg-white rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Set Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cards</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parallels</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview.baseSets.map((set, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{set.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        set.type === 'Base' ? 'bg-green-100 text-green-800' :
                        set.type === 'Autograph' ? 'bg-purple-100 text-purple-800' :
                        set.type === 'Memorabilia' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {set.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{set.cardsCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {set.parallelsCount}
                      {set.parallelsCount > 0 && (
                        <details className="mt-1">
                          <summary className="text-xs text-footy-green cursor-pointer hover:underline">
                            View parallels
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-gray-600">
                            {set.parallels.map((p, i) => (
                              <li key={i}>• {p}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{set.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import Button */}
          <div className="flex justify-end pt-4 border-t border-green-200">
            <button
              onClick={executeImport}
              disabled={loading}
              className="px-8 py-3 bg-footy-green text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Sets & Cards...' : 'Import All Sets & Cards'}
            </button>
          </div>
        </div>
      )}

      {/* Import in Progress */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="text-center space-y-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-footy-green"></div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-2">Creating sets and cards...</p>
              <p className="text-sm text-gray-500">This may take several minutes for large releases</p>
            </div>

            {/* Progress counters */}
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto pt-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-footy-green">{Math.floor(progressSets)}</div>
                <div className="text-sm text-gray-600 mt-1">Sets Created</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-600">{Math.floor(progressCards)}</div>
                <div className="text-sm text-gray-600 mt-1">Cards Created</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Summary */}
      {importSummary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-900 mb-4">Import Complete!</h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{importSummary.baseSetsCreated}</div>
              <div className="text-sm text-gray-600">Base Sets Created</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{importSummary.totalSetsCreated}</div>
              <div className="text-sm text-gray-600">Total Sets (with parallels)</div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">{importSummary.totalCardsCreated}</div>
              <div className="text-sm text-gray-600">Cards Created</div>
            </div>
          </div>

          <button
            onClick={() => {
              setImportSummary(null);
              setFile(null);
            }}
            className="px-6 py-2 bg-footy-green text-white font-semibold rounded-md hover:bg-green-700"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-2">Error</h3>
          <pre className="text-sm text-red-800 whitespace-pre-wrap">{error}</pre>
        </div>
      )}
    </div>
  );
}
