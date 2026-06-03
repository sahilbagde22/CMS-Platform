import { KPI, ChartPoint, Employee, Project, Activity, UploadedFile } from './types';

export const mockKPIData: KPI[] = [
  {
    id: '1',
    label: 'Total Revenue',
    value: '$2.4M',
    trend: 5.2,
    trendDirection: 'up',
    unit: 'YTD',
  },
  {
    id: '2',
    label: 'Overall Utilization',
    value: '85%',
    trend: 3.1,
    trendDirection: 'up',
  },
  {
    id: '3',
    label: 'Active Projects',
    value: '24',
    trend: 2.4,
    trendDirection: 'up',
  },
  {
    id: '4',
    label: 'Bench Count',
    value: '12',
    trend: -1.2,
    trendDirection: 'down',
  },
];

export const mockChartData: ChartPoint[] = [
  { month: 'Jan', revenue: 180000, cost: 95000 },
  { month: 'Feb', revenue: 210000, cost: 105000 },
  { month: 'Mar', revenue: 245000, cost: 125000 },
  { month: 'Apr', revenue: 220000, cost: 115000 },
  { month: 'May', revenue: 270000, cost: 130000 },
  { month: 'Jun', revenue: 310000, cost: 140000 },
];

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    role: 'Senior Developer',
    project: 'Project Alpha',
    utilization: 92,
    status: 'deployed',
  },
  {
    id: '2',
    name: 'Bob Smith',
    role: 'Product Designer',
    project: 'Project Beta',
    utilization: 88,
    status: 'deployed',
  },
  {
    id: '3',
    name: 'Carol Davis',
    role: 'QA Engineer',
    project: 'Bench',
    utilization: 0,
    status: 'bench',
  },
  {
    id: '4',
    name: 'David Wilson',
    role: 'Full Stack Developer',
    project: 'Project Gamma',
    utilization: 85,
    status: 'deployed',
  },
  {
    id: '5',
    name: 'Emma Martinez',
    role: 'Backend Developer',
    project: 'Leave',
    utilization: 0,
    status: 'leave',
  },
  {
    id: '6',
    name: 'Frank Brown',
    role: 'DevOps Engineer',
    project: 'Project Delta',
    utilization: 95,
    status: 'deployed',
  },
  {
    id: '7',
    name: 'Grace Lee',
    role: 'Product Manager',
    project: 'Project Alpha',
    utilization: 90,
    status: 'deployed',
  },
  {
    id: '8',
    name: 'Henry Taylor',
    role: 'Frontend Developer',
    project: 'Bench',
    utilization: 15,
    status: 'bench',
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Project Alpha',
    client: 'Acme Corp',
    poValue: 500000,
    consumed: 350000,
    total: 500000,
  },
  {
    id: '2',
    name: 'Project Beta',
    client: 'TechStart Inc',
    poValue: 350000,
    consumed: 280000,
    total: 350000,
  },
  {
    id: '3',
    name: 'Project Gamma',
    client: 'Global Systems',
    poValue: 420000,
    consumed: 180000,
    total: 420000,
  },
  {
    id: '4',
    name: 'Project Delta',
    client: 'Innovation Labs',
    poValue: 280000,
    consumed: 220000,
    total: 280000,
  },
  {
    id: '5',
    name: 'Project Epsilon',
    client: 'Enterprise Solutions',
    poValue: 600000,
    consumed: 450000,
    total: 600000,
  },
  {
    id: '6',
    name: 'Project Zeta',
    client: 'Cloud Ventures',
    poValue: 340000,
    consumed: 85000,
    total: 340000,
  },
];

export const mockActivity: Activity[] = [
  {
    id: '1',
    type: 'deployment',
    title: 'Alice Johnson deployed to Project Alpha',
    description: 'Senior Developer assigned to high-priority project',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '2',
    type: 'allocation',
    title: 'Budget allocated for Project Gamma',
    description: '$180K allocated from $420K PO',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: '3',
    type: 'update',
    title: 'Project Beta milestone completed',
    description: '80% of deliverables complete',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: '4',
    type: 'deployment',
    title: 'Frank Brown added to Project Delta',
    description: 'DevOps Engineer assigned',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
  },
  {
    id: '5',
    type: 'update',
    title: 'Quarterly review completed',
    description: 'Overall utilization at 85%',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

export const mockUploadHistory: UploadedFile[] = [
  {
    id: '1',
    name: 'Q2_2024_Allocation.xlsx',
    size: 245000,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '2',
    name: 'Employee_Data.xlsx',
    size: 180000,
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'success',
  },
  {
    id: '3',
    name: 'Project_Budget.xlsx',
    size: 320000,
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    status: 'success',
  },
];
