'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload, CheckCircle, XCircle, AlertTriangle,
  FileSpreadsheet, Loader2, ArrowRight, TableProperties
} from 'lucide-react';
import Link from 'next/link';
import type { SheetValidationWarning } from '@/types/app.types';
import {
  EMPLOYEE_MASTER_COLUMNS,
  PROJECT_MASTER_COLUMNS,
  DEPLOYMENT_LOG_COLUMNS,
} from '@/lib/constants/columns';
import { SHEET_NAMES } from '@/lib/constants/sheets';
import { UploadHistory } from '@/components/dashboard/UploadHistory';
import { toast } from 'sonner';

type UploadState = 'idle' | 'uploading' | 'mapping' | 'processing' | 'success' | 'error';

interface PreviewSheet {
  sheetName: string;
  headers: string[];
  suggestedMappings: Record<string, string | null>;
}

interface UploadResult {
  uploadId: string;
  warnings: SheetValidationWarning[];
}

const REQUIRED_SHEETS = [SHEET_NAMES.EMPLOYEE_MASTER, SHEET_NAMES.PROJECT_MASTER, SHEET_NAMES.DEPLOYMENT_LOG];

const SHEET_COLUMNS_MAP: Record<string, readonly string[]> = {
  [SHEET_NAMES.EMPLOYEE_MASTER]: EMPLOYEE_MASTER_COLUMNS,
  [SHEET_NAMES.PROJECT_MASTER]: PROJECT_MASTER_COLUMNS,
  [SHEET_NAMES.DEPLOYMENT_LOG]: DEPLOYMENT_LOG_COLUMNS,
};

export default function UploadPage() {
  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [previewSheets, setPreviewSheets] = useState<PreviewSheet[]>([]);
  
  // mappings: { [sheetName]: { [originalHeader]: canonicalHeader | null } }
  const [mappings, setMappings] = useState<Record<string, Record<string, string | null>>>({});
  
  const [result, setResult] = useState<UploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePreview = async (f: File) => {
    setState('uploading');
    setProgress(30);
    setErrorMsg(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append('file', f);
      setProgress(60);

      const res = await fetch('/api/upload/preview', { method: 'POST', body: fd });
      const json = await res.json();
      setProgress(100);

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Failed to parse file');
      }

      setPreviewSheets(json.data.sheets);
      
      // Initialize mappings state with suggestions
      const initialMappings: Record<string, Record<string, string | null>> = {};
      json.data.sheets.forEach((sheet: PreviewSheet) => {
        initialMappings[sheet.sheetName] = { ...sheet.suggestedMappings };
      });
      setMappings(initialMappings);
      
      setState('mapping');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    
    setState('processing');
    setProgress(10);
    setErrorMsg(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('mappings', JSON.stringify(mappings));
      setProgress(40);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      setProgress(80);

      const json = await res.json();
      setProgress(100);

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'Upload failed');
      }

      setResult(json.data);
      setState('success');
      setRefreshKey(prev => prev + 1);
      toast.success('Data processed successfully', { 
        description: 'Your operations dashboard has been updated with the latest metrics.',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      setState('error');
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (f) { setFile(f); handlePreview(f); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: state === 'uploading' || state === 'processing',
  });

  const reset = () => {
    setState('idle');
    setFile(null);
    setResult(null);
    setErrorMsg(null);
    setProgress(0);
    setPreviewSheets([]);
    setMappings({});
  };

  const handleMappingChange = (sheetName: string, originalHeader: string, value: string) => {
    setMappings(prev => ({
      ...prev,
      [sheetName]: {
        ...prev[sheetName],
        [originalHeader]: value === 'ignore' ? null : value
      }
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Excel File</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Upload a single .xlsx file containing all 3 required sheets.
        </p>
      </div>

      {/* Required Sheets Info */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
        <p className="text-xs font-medium text-orange-300 mb-2">Required sheets in your Excel file:</p>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_SHEETS.map((s) => (
            <span key={s} className="px-2.5 py-1 bg-orange-500/15 border border-orange-500/20 rounded-lg text-xs font-mono text-orange-300">
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
              ? 'border-orange-400 bg-orange-500/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-orange-500/50 hover:bg-white/40 dark:bg-slate-900/40'
            }
          `}
        >
          <input {...getInputProps()} />
          <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-900 dark:text-white font-medium mb-1">
            {isDragActive ? 'Drop your Excel file here' : 'Drag & drop your Excel file'}
          </p>
          <p className="text-slate-500 text-sm mb-4">or click to browse</p>
          <p className="text-xs text-slate-600">.xlsx or .xls · Max 10MB</p>
        </div>
      )}

      {/* Uploading/Processing State */}
      {(state === 'uploading' || state === 'processing') && (
        <div className="border border-slate-200/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 rounded-2xl p-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-orange-400 animate-spin mx-auto" />
          <div>
            <p className="text-slate-900 dark:text-white font-medium">{file?.name}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {state === 'uploading' ? 'Analyzing your Excel file...' : 'Processing data and calculating metrics...'}
            </p>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mx-auto max-w-xs">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Mapping State */}
      {state === 'mapping' && (
        <div className="space-y-6">
          <div className="border border-orange-500/20 bg-orange-500/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TableProperties className="w-6 h-6 text-orange-400 shrink-0" />
              <p className="text-slate-900 dark:text-white font-semibold">Review Column Mappings</p>
            </div>
            <p className="text-orange-300 text-sm pl-9">
              We&apos;ve automatically matched your Excel headers to the database columns. 
              Please verify them below before saving.
            </p>
          </div>

          <div className="space-y-6">
            {previewSheets
              .filter(sheet => SHEET_COLUMNS_MAP[sheet.sheetName]) // Only show required sheets
              .map((sheet) => {
              const availableColumns = SHEET_COLUMNS_MAP[sheet.sheetName] || [];
              
              return (
                <div key={sheet.sheetName} className="bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-100/20 dark:bg-slate-800/20">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{sheet.sheetName}</h3>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 px-2">
                      <div>Your Excel Header</div>
                      <div>Maps to Database Column</div>
                    </div>
                    <div className="space-y-2">
                      {sheet.headers.map((header) => {
                        const currentValue = mappings[sheet.sheetName]?.[header] ?? 'ignore';
                        return (
                          <div key={header} className="grid grid-cols-2 gap-4 items-center bg-slate-100/30 dark:bg-slate-800/30 p-2 rounded-lg border border-slate-300/50 dark:border-slate-700/50">
                            <div className="text-sm text-slate-700 dark:text-slate-300 truncate font-mono px-2" title={header}>
                              {header}
                            </div>
                            <select
                              value={currentValue}
                              onChange={(e) => handleMappingChange(sheet.sheetName, header, e.target.value)}
                              className={`
                                w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none transition-colors
                                ${currentValue === 'ignore' ? 'text-slate-500' : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'}
                                focus:border-orange-500 focus:ring-1 focus:ring-orange-500
                              `}
                            >
                              <option value="ignore">-- Ignore Column --</option>
                              {availableColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20"
            >
              Confirm & Process Data <ArrowRight className="w-4 h-4" />
            </button>
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
                <p className="text-slate-900 dark:text-white font-semibold">Upload complete!</p>
                <p className="text-emerald-400 text-sm">{file?.name}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-mono">Upload ID: {result.uploadId}</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/overview"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-all"
            >
              View Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={reset}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all"
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
              <p className="text-slate-900 dark:text-white font-semibold">Upload failed</p>
            </div>
            <p className="text-rose-400 text-sm pl-9">{errorMsg}</p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-all"
          >
            <Upload className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}

      {/* Upload History */}
      <UploadHistory refreshTrigger={refreshKey} />
    </div>
  );
}
