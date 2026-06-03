'use client';

import Card from '@/components/shared/Card';
import Badge from '@/components/shared/Badge';
import Button from '@/components/shared/Button';
import { UploadedFile } from '@/lib/types';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useRef } from 'react';

interface ImportDataViewProps {
  onFileSelect?: (file: File) => void;
  uploadHistory?: UploadedFile[];
}

export default function ImportDataView({
  onFileSelect,
  uploadHistory = [],
}: ImportDataViewProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    onFileSelect?.(file);
    // Simulate upload
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + Math.random() * 30;
      });
    }, 300);
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const formatUploadDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6 p-8">
      {/* Upload Zone */}
      <Card
        className={`cursor-pointer border-2 border-dashed px-8 py-12 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {!isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
              <Upload size={32} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Drag & drop your file here
              </h3>
              <p className="mt-1 text-sm text-gray-500">or click to browse</p>
            </div>
            <p className="text-xs text-gray-400">Supported formats: Excel (.xlsx, .xls), CSV</p>
            <Button variant="primary" size="sm">
              Choose File
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="text-left w-full max-w-md">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-900">Uploading...</p>
                <p className="text-xs text-gray-500">{Math.round(uploadProgress)}%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Upload History */}
      {uploadHistory.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Uploads</h2>
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-100">
              {uploadHistory.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                      <File size={20} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {formatUploadDate(file.uploadedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {file.status === 'success' ? (
                      <>
                        <Badge variant="success">Completed</Badge>
                        <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                      </>
                    ) : (
                      <>
                        <Badge variant="error">Failed</Badge>
                        <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
