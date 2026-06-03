'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';
import Card from '@/components/shared/Card';
import { formatCurrency } from '@/lib/utils/format-currency';

interface UploadHistoryItem {
  id: string;
  uploaded_at: string;
  file_name: string;
  file_size: number;
  status: 'processing' | 'ready' | 'error';
  error_msg: string | null;
  metrics: {
    total_employees: number;
    total_revenue: number;
    overall_gm_pct: number;
  } | null;
}

interface UploadHistoryProps {
  refreshTrigger?: number;
}

export function UploadHistory({ refreshTrigger = 0 }: UploadHistoryProps) {
  const [history, setHistory] = useState<UploadHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/uploads');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Failed to fetch history');
      setHistory(json.data.uploads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [refreshTrigger]);

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 mt-12 bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 mt-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) return null;

  return (
    <div className="mt-12 space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Upload History</h2>
      </div>

      <div className="space-y-3">
        {history.map((upload) => (
          <Card key={upload.id} className="flex flex-col sm:flex-row gap-4 p-4 transition-colors">
            {/* Icon & File info */}
            <div className="flex items-start gap-4 flex-1">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                upload.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                upload.status === 'error' ? 'bg-rose-50 text-rose-600' :
                'bg-orange-50 text-orange-600'
              }`}>
                {upload.status === 'ready' ? <CheckCircle className="w-5 h-5" /> :
                 upload.status === 'error' ? <XCircle className="w-5 h-5" /> :
                 <Loader2 className="w-5 h-5 animate-spin" />}
              </div>
              
              <div>
                <p className="font-medium text-gray-900 line-clamp-1">{upload.file_name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{new Date(upload.uploaded_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                  <span>{formatBytes(upload.file_size)}</span>
                </div>
                {upload.status === 'error' && upload.error_msg && (
                  <p className="text-xs text-rose-600 mt-2 bg-rose-50 px-2 py-1 rounded-md inline-block">
                    {upload.error_msg}
                  </p>
                )}
              </div>
            </div>

            {/* Metrics */}
            {upload.status === 'ready' && upload.metrics && (
              <div className="flex items-center gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-6 shrink-0">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Employees</p>
                  <p className="text-sm font-medium text-gray-900">{upload.metrics.total_employees}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Revenue</p>
                  <p className="text-sm font-medium text-emerald-600">{formatCurrency(upload.metrics.total_revenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">GM %</p>
                  <p className="text-sm font-medium text-indigo-600">{upload.metrics.overall_gm_pct.toFixed(1)}%</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
