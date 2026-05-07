'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, CheckCircle, XCircle, AlertTriangle,
  FileSpreadsheet, Loader2, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import type { SheetValidationWarning } from '@/types/app.types';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

interface UploadResult {
  uploadId: string;
  warnings: SheetValidationWarning[];
}

const REQUIRED_SHEETS = ['Employee_Master', 'Project_Master', 'Deployment_Log'];

export default function UploadPage() {
  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const upload = async (f: File) => {
    setState('uploading');
    setProgress(10);
    setErrorMsg(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', f);
      setProgress(30);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      setProgress(80);

      const json = await res.json();
      setProgress(100);

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Upload failed');
      }

      setResult(json.data);
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (f) { setFile(f); upload(f); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: state === 'uploading',
  });

  const reset = () => {
    setState('idle');
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Excel File</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload a single .xlsx file containing all 3 required sheets.
        </p>
      </div>

      {/* Required Sheets Info */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4">
        <p className="text-xs font-medium text-violet-300 mb-2">Required sheets in your Excel file:</p>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_SHEETS.map((s) => (
            <span key={s} className="px-2.5 py-1 bg-violet-500/15 border border-violet-500/20 rounded-lg text-xs font-mono text-violet-300">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      {state === 'idle' && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragActive
              ? 'border-violet-400 bg-violet-500/10'
              : 'border-slate-700 hover:border-violet-500/50 hover:bg-slate-900/40'
            }
          `}
        >
          <input {...getInputProps()} />
          <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto mb-4" />
          <p className="text-white font-medium mb-1">
            {isDragActive ? 'Drop your Excel file here' : 'Drag & drop your Excel file'}
          </p>
          <p className="text-slate-500 text-sm mb-4">or click to browse</p>
          <p className="text-xs text-slate-600">.xlsx or .xls · Max 10MB</p>
        </div>
      )}

      {/* Uploading State */}
      {state === 'uploading' && (
        <div className="border border-slate-800/60 bg-slate-900/50 rounded-2xl p-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
          <div>
            <p className="text-white font-medium">{file?.name}</p>
            <p className="text-slate-400 text-sm mt-1">Processing your data…</p>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto max-w-xs">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-center gap-6 text-xs text-slate-500">
            <span className={progress >= 30 ? 'text-violet-400' : ''}>Parsing Excel</span>
            <span className={progress >= 50 ? 'text-violet-400' : ''}>Validating sheets</span>
            <span className={progress >= 70 ? 'text-violet-400' : ''}>Storing data</span>
            <span className={progress >= 90 ? 'text-violet-400' : ''}>Calculating metrics</span>
          </div>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && result && (
        <div className="space-y-4">
          <div className="border border-emerald-500/20 bg-emerald-500/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="text-white font-semibold">Upload complete!</p>
                <p className="text-emerald-400 text-sm">{file?.name}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-mono">Upload ID: {result.uploadId}</p>
          </div>

          {result.warnings.length > 0 && (
            <div className="border border-amber-500/20 bg-amber-500/10 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-medium text-amber-300">{result.warnings.length} normalization notice{result.warnings.length > 1 ? 's' : ''}</p>
              </div>
              {result.warnings.map((w, i) => (
                <div key={i} className="text-xs text-amber-500/80 pl-6">
                  <span className="font-medium text-amber-400">[{w.sheet}]</span> {w.message}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/overview"
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all"
            >
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={reset}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
            >
              Upload Another
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="space-y-4">
          <div className="border border-rose-500/20 bg-rose-500/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              <p className="text-white font-semibold">Upload failed</p>
            </div>
            <p className="text-rose-400 text-sm pl-9">{errorMsg}</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-all"
          >
            <Upload className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {/* Validation notes */}
      {state === 'idle' && (
        <div className="text-xs text-slate-600 space-y-1">
          <p>✓ Maximum file size: 10MB</p>
          <p>✓ Column names are fuzzy-matched — exact spelling not required</p>
          <p>✓ Currency values (₹, commas) are auto-cleaned</p>
          <p>✓ Dates are automatically normalized to ISO format</p>
          <p>✓ All metrics are calculated automatically on upload</p>
        </div>
      )}
    </div>
  );
}
