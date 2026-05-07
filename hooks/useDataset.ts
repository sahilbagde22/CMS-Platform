'use client';

import { useEffect, useState, useCallback } from 'react';

interface DatasetData {
  id: string;
  sheet_name: string;
  display_name: string | null;
  row_count: number;
  column_count: number;
  schema_json: unknown;
  data_json: unknown;
  has_ai_cleaned: boolean;
}

interface UseDatasetReturn {
  dataset: DatasetData | null;
  flags: unknown[];
  charts: unknown[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDataset(id: string): UseDatasetReturn {
  const [dataset, setDataset] = useState<DatasetData | null>(null);
  const [flags, setFlags] = useState<unknown[]>([]);
  const [charts, setCharts] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await window.fetch(`/api/datasets/${id}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? 'Failed to load dataset');

      setDataset(json.data);
      setFlags(json.flags ?? []);

      // Also fetch charts for this dataset
      const chartsRes = await window.fetch(`/api/charts?dataset_id=${id}`);
      const chartsJson = await chartsRes.json();
      setCharts(chartsJson.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { dataset, flags, charts, isLoading, error, refetch: fetch };
}
