'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

export default function CreateReleasePage() {
  const router = useRouter();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileUrl, setDocumentFileUrl] = useState<string>('');
  const [documentMimeType, setDocumentMimeType] = useState<string>('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedReleaseDate, setEditedReleaseDate] = useState<string>('');

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
        totalCards: string | null;
        parallels: string[] | null;
        autographs: boolean;
        memorabilia: boolean;
        numbered: boolean;
      }>;
    };
    description: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentFile(file);
      setError(null);
      setAnalysisResult(null);

      // Auto-trigger analysis
      await analyzeFile(file);
    }
  };

  const analyzeFile = async (file: File) => {
    try {
      setUploading(true);
      setAnalyzing(true);
      setError(null);

      // Step 1: Upload file to blob storage
      console.log('Uploading file to blob storage...');
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { url: fileUrl } = await uploadResponse.json();
      console.log('File uploaded:', fileUrl);

      // Store the file URL and mime type for later use when creating the release
      setDocumentFileUrl(fileUrl);
      setDocumentMimeType(file.type);

      setUploading(false);

      // Step 2: Analyze with Genkit (Claude Sonnet 4 will read the PDF directly)
      console.log('Analyzing release with Claude Sonnet 4...');
      const analyzeResponse = await fetch('/api/releases/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          mimeType: file.type,
          uploadedImages: uploadedImageUrls,
          createRelease: false,
        }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.details || 'Failed to analyze release');
      }

      const result = await analyzeResponse.json();
      console.log('Analysis complete:', result);

      setAnalysisResult(result);
      setEditedReleaseDate(result.releaseInfo.releaseDate || '');
      setAnalyzing(false);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setUploading(false);
      setAnalyzing(false);
    }
  };
  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      // Immediately upload the selected files
      try {
        setUploadingImages(true);
        setError(null);

        const urls: string[] = [];
        for (const file of files) {
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

        // Append to existing uploaded images
        setUploadedImageUrls(prev => [...prev, ...urls]);
        setUploadingImages(false);
        console.log(`Uploaded ${urls.length} images`);

        // Clear the file input so user can select more files
        e.target.value = '';
      } catch (err) {
        console.error('Error uploading images:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload images');
        setUploadingImages(false);
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
          fileUrl: documentFileUrl,
          mimeType: documentMimeType,
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

        {/* Document Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">1. Upload Release Document</h2>

          <div className="relative">
            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                uploading || analyzing
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : documentFile
                  ? 'border-green-400 bg-green-50 hover:bg-green-100'
                  : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-orange-500'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading || analyzing ? (
                  <>
                    <svg className="w-12 h-12 mb-4 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mb-2 text-sm text-gray-700 font-semibold">
                      {uploading ? 'Processing document...' : 'footy is analyzing...'}
                    </p>
                  </>
                ) : documentFile ? (
                  <>
                    <svg className="w-12 h-12 mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-700 font-semibold">{documentFile.name}</p>
                    <p className="text-xs text-gray-500">Click to select a different file</p>
                  </>
                ) : (
                  <>
                    <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-700 font-semibold">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF or image files (Claude Sonnet 4 will analyze directly)</p>
                  </>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,application/pdf,image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading || analyzing}
              />
            </label>
          </div>

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
              <h2 className="text-xl font-semibold mb-4">2. Review Extracted Information</h2>

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
                      value={editedReleaseDate}
                      onChange={(e) => setEditedReleaseDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., May 4, 2025 or Spring 2025 or 1978"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Can be specific (May 4, 2025) or vague (Spring 2025, 1978)
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (AI Generated)
                  </label>
                  <div className="px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-sm whitespace-pre-wrap">
                    {analysisResult.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Source Documents and Images */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold mb-3">Source Documents and Images</h3>
              <p className="text-sm text-gray-600 mb-4">
                The source document used to generate this release is shown below. Upload images (JPG, PNG, WebP, GIF) of the release for the image carousel - these can be sell sheet pages, product photos, or any visuals you want to display. Images will be automatically uploaded when you create the release.
              </p>

              <div className="space-y-6">
                {/* Source Document Display */}
                {documentFile && documentFileUrl && (
                  <div className="border-2 border-footy-green/30 rounded-lg p-4 bg-footy-green/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg className="w-8 h-8 text-footy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-semibold text-gray-900">{documentFile.name}</p>
                          <p className="text-xs text-gray-600">Source document used for AI analysis</p>
                        </div>
                      </div>
                      <a
                        href={documentFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-footy-orange text-white text-sm rounded-md hover:bg-footy-orange/90"
                      >
                        View {documentFile.type.includes('pdf') ? 'PDF' : 'Image'}
                      </a>
                    </div>
                  </div>
                )}

                {/* Image Upload Section */}
                <div>
                  <h4 className="text-md font-semibold mb-3">Release Images for Carousel</h4>

                  <div className="relative">
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFilesChange}
                      className="hidden"
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex items-center justify-center px-6 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadingImages
                          ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                          : 'border-green-400 bg-green-50 hover:bg-green-100 hover:border-green-500'
                      }`}
                    >
                      {uploadingImages ? (
                        <>
                          <svg className="w-5 h-5 mr-2 text-green-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Uploading images...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span className="text-sm font-medium text-green-700">
                            {uploadedImageUrls.length > 0 ? 'Add More Images' : 'Choose Files'}
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Images upload automatically when selected. You can add multiple images one at a time or select multiple files at once.
                  </p>

                  {uploadedImageUrls.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-green-600 font-medium mb-3">
                        {uploadedImageUrls.length} image{uploadedImageUrls.length !== 1 ? 's' : ''} uploaded
                      </p>
                      <div className="grid grid-cols-4 gap-3">
                        {uploadedImageUrls.map((url, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-square border-2 border-green-300 rounded-lg overflow-hidden bg-white group"
                          >
                            <img
                              src={url}
                              alt={`Upload ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                            <button
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="Remove image"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Create Button */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">3. Create Release</h2>
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
