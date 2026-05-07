'use client';

import { useEffect, useState, useCallback } from 'react';

interface ChartSummary {
  id: string;
  title: string;
  chart_type: string;
  dataset_id: string;
  is_public: boolean;
  created_at: string;
}

interface UseChartsReturn {
  charts: ChartSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  deleteChart: (id: string) => Promise<void>;
}

export function useCharts(datasetId?: string): UseChartsReturn {
  const [charts, setCharts] = useState<ChartSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = datasetId ? `/api/charts?dataset_id=${datasetId}` : '/api/charts';
      const res = await window.fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to load charts');
      setCharts(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const deleteChart = useCallback(async (id: string) => {
    const res = await window.fetch(`/api/charts/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? 'Failed to delete chart');
    }
    setCharts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { charts, isLoading, error, refetch: fetch, deleteChart };
}
