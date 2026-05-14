'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function AiInsights() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/ai/insights');
        const json = await res.json();
        
        if (!json.success) {
          throw new Error(json.error || 'Failed to load insights');
        }
        
        setInsights(json.insights);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchInsights();
  }, []);

  return (
    <div className="bg-gradient-to-br from-orange-500/5 to-white dark:from-orange-900/40 dark:to-slate-900/50 border border-orange-500/20 rounded-2xl p-5 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-orange-500/20 rounded-lg">
          <Sparkles className="w-4 h-4 text-orange-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">AI Executive Summary</h2>
      </div>

      <div className="text-sm text-slate-700 dark:text-slate-300">
        {loading && (
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
            <span>Gemini is analyzing your operations data...</span>
          </div>
        )}
        
        {error && !loading && (
          <div className="flex items-start gap-2 text-rose-600 dark:text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-xs">{error}</span>
          </div>
        )}
        
        {insights && !loading && !error && (
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <ReactMarkdown
              components={{
                ul: ({node, ...props}) => <ul className="space-y-2 m-0 p-0 pl-4" {...props} />,
                li: ({node, ...props}) => <li className="m-0 marker:text-orange-500" {...props} />,
                p: ({node, ...props}) => <p className="m-0 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
                strong: ({node, ...props}) => <strong className="text-slate-900 dark:text-white font-medium" {...props} />
              }}
            >
              {insights}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
