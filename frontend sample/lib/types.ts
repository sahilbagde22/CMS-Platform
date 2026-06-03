export interface KPI {
  id: string;
  label: string;
  value: string | number;
  trend: number;
  trendDirection: 'up' | 'down';
  unit?: string;
}

export interface ChartPoint {
  month: string;
  revenue: number;
  cost: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  project: string;
  utilization: number;
  status: 'deployed' | 'bench' | 'leave';
  avatar?: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  poValue: number;
  consumed: number;
  total: number;
}

export interface Activity {
  id: string;
  type: 'deployment' | 'allocation' | 'update';
  title: string;
  description: string;
  timestamp: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadedAt: Date;
  status: 'success' | 'error';
}
