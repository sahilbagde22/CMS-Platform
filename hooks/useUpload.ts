'use client';

import { useState, useCallback } from 'react';

interface UploadState {
  status: 'idle' | 'previewing' | 'uploading' | 'done' | 'error';
  progress: number;
  error: string | null;
  result: {
    uploadId: string;
    datasetIds: string[];
    truncatedSheets: string[];
    flags: unknown[];
    summary: string;
  } | null;
}

interface UseUploadReturn {
  state: UploadState;
  preview: (file: File) => Promise<{ sheets: { name: string; rowCount: number }[] } | null>;
  upload: (file: File, selectedSheets: string[]) => Promise<void>;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    error: null,
    result: null,
  });

  const preview = useCallback(async (file: File) => {
    setState({ status: 'previewing', progress: 0, error: null, result: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('preview', 'true');

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Preview failed');

      setState((s) => ({ ...s, status: 'idle' }));
      return data as { sheets: { name: string; rowCount: number }[] };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Preview failed';
      setState({ status: 'error', progress: 0, error: msg, result: null });
      return null;
    }
  }, []);

  const upload = useCallback(async (file: File, selectedSheets: string[]) => {
    setState({ status: 'uploading', progress: 10, error: null, result: null });

    // Simulate progress ticks while waiting for server
    const progressInterval = setInterval(() => {
      setState((s) => ({
        ...s,
        progress: Math.min(s.progress + 5, 85),
      }));
    }, 800);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sheetNames', JSON.stringify(selectedSheets));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      clearInterval(progressInterval);

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setState({
        status: 'done',
        progress: 100,
        error: null,
        result: data,
      });
    } catch (err) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setState({ status: 'error', progress: 0, error: msg, result: null });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', progress: 0, error: null, result: null });
  }, []);

  return { state, preview, upload, reset };
}
