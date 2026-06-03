'use client';

import { mockUploadHistory } from '@/lib/mockData';
import ImportDataView from '@/components/dashboard/ImportDataView';

export default function ImportPage() {
  const handleFileSelect = (file: File) => {
    console.log('File selected:', file.name, file.size);
  };

  return (
    <ImportDataView onFileSelect={handleFileSelect} uploadHistory={mockUploadHistory} />
  );
}
