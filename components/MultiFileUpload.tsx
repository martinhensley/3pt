"use client";

import { useState } from "react";
import Image from "next/image";

interface UploadedFile {
  url: string;
  filename: string;
  type: string;
  mimeType: string;
  size: number;
}

interface MultiFileUploadProps {
  onFilesUploaded: (files: Array<{ url: string; type: string }>) => void;
  acceptedTypes?: string;
  label?: string;
}

export default function MultiFileUpload({
  onFilesUploaded,
  acceptedTypes = "image/*,.pdf,.csv,.html,.txt",
  label = "Upload Files",
}: MultiFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
    }
  };

  const handleRemoveSelected = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleRemoveUploaded = (index: number) => {
    const newUploaded = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newUploaded);
    // Notify parent of updated file list
    onFilesUploaded(
      newUploaded.map((f) => ({ url: f.url, type: f.type }))
    );
  };

  const handleUploadAll = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const uploaded: UploadedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setUploadProgress(`Uploading ${i + 1} of ${selectedFiles.length}: ${file.name}`);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const data = await response.json();
        uploaded.push(data);
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    const allUploaded = [...uploadedFiles, ...uploaded];
    setUploadedFiles(allUploaded);
    setSelectedFiles([]);
    setUploading(false);
    setUploadProgress("");

    // Notify parent component
    onFilesUploaded(allUploaded.map((f) => ({ url: f.url, type: f.type })));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileTypeLabel = (type: string): string => {
    switch (type) {
      case "image":
        return "Image";
      case "pdf":
        return "PDF";
      case "csv":
        return "CSV";
      case "html":
        return "HTML";
      case "text":
        return "Text";
      default:
        return "File";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
        <input
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          disabled={uploading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-footy-gold text-gray-900 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-600">
          You can select multiple files. Supported: images, PDFs, CSVs, HTML,
          text files
        </p>
      </div>

      {/* Selected Files (not yet uploaded) */}
      {selectedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSelected(index)}
                  disabled={uploading}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm font-semibold disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={uploading}
            className="mt-3 w-full bg-footy-dark-green text-white font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {uploading ? "Uploading..." : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""}`}
          </button>
          {uploadProgress && (
            <p className="mt-2 text-sm text-gray-600 text-center">
              {uploadProgress}
            </p>
          )}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Files ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
              >
                {/* Show thumbnail for images */}
                {file.type === "image" && (
                  <div className="flex-shrink-0 w-16 h-16 mr-3 relative">
                    <Image
                      src={file.url}
                      alt={file.filename}
                      fill
                      className="object-cover rounded border border-gray-300"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-semibold bg-footy-gold text-footy-dark-green rounded">
                      {getFileTypeLabel(file.type)}
                    </span>
                    <p className="text-sm font-medium text-gray-900">
                      {file.filename}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveUploaded(index)}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
