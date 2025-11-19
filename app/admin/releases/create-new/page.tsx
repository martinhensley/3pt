'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function CreateReleasePage() {
  const router = useRouter();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState<string>('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<{
    releaseInfo: {
      manufacturer: string;
      releaseName: string;
      year: string;
      fullReleaseName: string;
      slug: string;
      releaseDate: string | null;
      sets: Array<{
        name: string;
        expectedCardCount: number | null;
        parallels: string[] | null;
        autographs: boolean;
        memorabilia: boolean;
        numbered: boolean;
      }>;
    };
    summary: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(files);
    }
  };

  const handleUploadImages = async () => {
    if (imageFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    try {
      setUploadingImages(true);
      setError(null);

      const urls: string[] = [];
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const { url } = await response.json();
        urls.push(url);
      }

      setUploadedImageUrls(urls);
      setUploadingImages(false);
      console.log(`Uploaded ${urls.length} images`);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload images');
      setUploadingImages(false);
    }
  };

  const handleAnalyze = async () => {
    if (!documentText.trim()) {
      setError('Please paste the document text');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);

      // Analyze with Genkit
      console.log('Analyzing release...');
      const analyzeResponse = await fetch('/api/releases/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          uploadedImages: uploadedImageUrls,
          createRelease: false, // Just analyze, don't create yet
        }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.details || 'Failed to analyze release');
      }

      const result = await analyzeResponse.json();
      console.log('Analysis complete:', result);

      setAnalysisResult(result);
      setAnalyzing(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalyzing(false);
    }
  };

  const handleCreateRelease = async () => {
    if (!analysisResult) return;

    try {
      setAnalyzing(true);
      setError(null);

      // Create release with the analyzed data
      const response = await fetch('/api/releases/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          uploadedImages: uploadedImageUrls,
          createRelease: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create release');
      }

      const result = await response.json();
      console.log('Release created:', result);

      // Redirect to the releases list
      router.push('/admin/releases');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalyzing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Release</h1>

        {/* Document Text Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Paste Document Text</h2>
          <p className="text-sm text-gray-600 mb-4">
            Paste the text from your sell sheet, catalog, or release document. The AI will extract the release name, sets, parallels, and other details.
          </p>

          <textarea
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder="Paste your document text here..."
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-md font-mono text-sm"
            disabled={analyzing}
          />
        </div>

        {/* Image Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">2. Upload Release Images</h2>
          <p className="text-sm text-gray-600 mb-4">
            Upload images of the release (sell sheet pages, product photos, etc.) These will be used in the image carousel.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageFilesChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                disabled={uploadingImages}
              />

              <button
                onClick={handleUploadImages}
                disabled={imageFiles.length === 0 || uploadingImages}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {uploadingImages ? 'Uploading...' : 'Upload Images'}
              </button>
            </div>

            {uploadedImageUrls.length > 0 && (
              <div>
                <p className="text-sm text-green-600 font-medium mb-2">
                  {uploadedImageUrls.length} image{uploadedImageUrls.length !== 1 ? 's' : ''} uploaded
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {uploadedImageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square border-2 border-green-300 rounded-lg overflow-hidden bg-white"
                    >
                      <img
                        src={url}
                        alt={`Upload ${idx + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Analyze Button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={handleAnalyze}
            disabled={!documentText.trim() || analyzing}
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Document'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-600">{error}</p>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <>
            {/* Release Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">3. Review Extracted Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Release Name
                  </label>
                  <input
                    type="text"
                    value={analysisResult.releaseInfo.fullReleaseName}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={analysisResult.releaseInfo.year}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      value={analysisResult.releaseInfo.manufacturer}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Release Date
                    </label>
                    <input
                      type="text"
                      value={analysisResult.releaseInfo.releaseDate || 'Not specified'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summary (AI Generated)
                  </label>
                  <div className="px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm whitespace-pre-wrap">
                    {analysisResult.summary}
                  </div>
                </div>
              </div>
            </div>

            {/* Sets */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Extracted Sets</h3>
              <div className="space-y-4">
                {analysisResult.releaseInfo.sets.map((set, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-md p-4">
                    <div className="font-semibold text-lg mb-2">{set.name}</div>
                    {set.expectedCardCount && (
                      <div className="text-sm text-gray-600 mb-1">
                        Total Cards: {set.expectedCardCount}
                      </div>
                    )}
                    {set.parallels && set.parallels.length > 0 && (
                      <div className="text-sm text-gray-600 mb-1">
                        Parallels: {set.parallels.join(', ')}
                      </div>
                    )}
                    <div className="flex gap-3 text-xs mt-2">
                      {set.autographs && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          Autographs
                        </span>
                      )}
                      {set.memorabilia && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          Memorabilia
                        </span>
                      )}
                      {set.numbered && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          Numbered
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create Button */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">4. Create Release</h2>
              <p className="text-sm text-gray-600 mb-4">
                Review the information above. If everything looks correct, click the button below to
                create the release in the database.
              </p>

              <button
                onClick={handleCreateRelease}
                disabled={analyzing}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Creating Release...' : 'Create Release'}
              </button>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
