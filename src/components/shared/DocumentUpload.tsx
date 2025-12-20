/**
 * DocumentUpload Component
 * Reusable component for uploading documents (images/PDFs) to Cloudinary
 * Similar to ImageUpload but supports PDF files
 */

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Loader2, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadDocumentToCloudinary, UploadProgress } from '@/lib/services/cloudinary-service';

interface DocumentUploadProps {
  label: string;
  currentDocumentUrl?: string;
  onDocumentUploaded: (url: string) => void;
  onDocumentRemoved?: () => void;
  folder?: string;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export function DocumentUpload({
  label,
  currentDocumentUrl,
  onDocumentUploaded,
  onDocumentRemoved,
  folder = 'purchase-bills',
  accept = 'image/png,image/jpeg,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  maxSize = 3,
  className = '',
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentDocumentUrl || null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Reset error
    setError(null);

    // Reject video files explicitly
    if (file.type.startsWith('video/')) {
      setError('Video files are not allowed');
      return;
    }

    // Validate file type
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    const isDoc = file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isPdf && !isImage && !isDoc) {
      setError('Please select an image, PDF, or Word document (DOC/DOCX)');
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Set file type
    setFileType(isPdf ? 'pdf' : 'image');

    // Create local preview for images
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs and Word documents, we'll show the uploaded URL after upload
      setPreviewUrl(null);
    }

    // Upload to Cloudinary
    uploadDocument(file);
  };

  const uploadDocument = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const response = await uploadDocumentToCloudinary(file, folder, (progress: UploadProgress) => {
        setUploadProgress(progress.percentage);
      });

      // Update parent component with new URL
      onDocumentUploaded(response.secure_url);
      setPreviewUrl(response.secure_url);
      setUploadProgress(100);
      
      console.log('✅ Document uploaded:', file.name);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreviewUrl(currentDocumentUrl || null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveDocument = () => {
    setPreviewUrl(null);
    setFileType(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onDocumentRemoved?.();
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleViewDocument = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const handleDownloadDocument = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = 'purchase-bill';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Determine if current document is a PDF
  const isPdfUrl = previewUrl?.includes('.pdf') || previewUrl?.includes('resource_type/raw');

  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Upload Area */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isUploading}
          />

          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Uploading...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG or PDF up to {maxSize}MB
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Preview Area
        <div className="relative border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-4">
            {/* Document Preview/Icon */}
            <div className="flex-shrink-0">
              {isPdfUrl ? (
                <div className="h-16 w-16 rounded-lg bg-red-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center overflow-hidden">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Document preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Document Info and Actions */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {isPdfUrl ? 'PDF Document' : 'Image Document'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Uploaded successfully
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveDocument}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleViewDocument}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadDocument}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
