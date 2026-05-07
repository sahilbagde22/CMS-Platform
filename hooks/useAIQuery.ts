'use client';

import { useState, useRef, useCallback } from 'react';

interface AIQueryResult {
  sql: string;
  explanation: string;
  suggested_chart_type: string;
  x_axis_column: string;
  y_axis_column: string;
  rows: Record<string, unknown>[];
  total: number;
}

interface UseAIQueryReturn {
  query: (question: string, datasetId: string) => Promise<void>;
  result: AIQueryResult | null;
  isLoading: boolean;
  error: string | null;
  clear: () => void;
}

export function useAIQuery(): UseAIQueryReturn {
  const [result, setResult] = useState<AIQueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useCallback(async (question: string, datasetId: string) => {
    // Debounce — don't fire if called rapidly (e.g. on every keystroke)
    if (debounceRef.current) clearTimeout(debounceRef.current);

    return new Promise<void>((resolve) => {
      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await fetch('/api/ai/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, dataset_id: datasetId }),
          });
          const data = await res.json();

          if (!res.ok) throw new Error(data.error ?? 'Query failed');

          setResult(data as AIQueryResult);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Query failed');
        } finally {
          setIsLoading(false);
          resolve();
        }
      }, 300);
    });
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { query, result, isLoading, error, clear };
}
