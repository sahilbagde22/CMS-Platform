'use client';

import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import { Project } from '@/lib/types';
import { DollarSign } from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  onAllocate?: (projectId: string, allocation: number) => void;
}

export default function ProjectsView({ projects, onAllocate }: ProjectsViewProps) {
  const getProgressPercentage = (consumed: number, total: number) => {
    return Math.round((consumed / total) * 100);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Projects & Allocation</h1>
        <Button variant="primary" size="sm">
          Add Project
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = getProgressPercentage(project.consumed, project.total);
          const remaining = project.poValue - project.consumed;

          return (
            <Card key={project.id} className="flex flex-col gap-6 p-6">
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-600">{project.client}</p>
              </div>

              {/* PO Value */}
              <div className="rounded-lg bg-indigo-50 p-4">
                <p className="text-xs font-medium text-gray-600">Total PO Value</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(project.poValue)}
                </p>
              </div>

              {/* Budget Progress */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-600">Budget Consumption</p>
                  <p className="text-xs font-semibold text-gray-900">{progress}%</p>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Consumed: {formatCurrency(project.consumed)}</span>
                  <span>Remaining: {formatCurrency(remaining)}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAllocate?.(project.id, project.consumed)}
                className="w-full"
              >
                Manage Allocation
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Summary Stats */}
      <Card className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
        {[
          {
            label: 'Total PO Value',
            value: formatCurrency(projects.reduce((sum, p) => sum + p.poValue, 0)),
          },
          {
            label: 'Total Consumed',
            value: formatCurrency(projects.reduce((sum, p) => sum + p.consumed, 0)),
          },
          {
            label: 'Total Remaining',
            value: formatCurrency(
              projects.reduce((sum, p) => sum + (p.poValue - p.consumed), 0)
            ),
          },
          {
            label: 'Avg. Consumption',
            value: `${Math.round(projects.reduce((sum, p) => sum + (p.consumed / p.total) * 100, 0) / projects.length)}%`,
          },
        ].map((stat, idx) => (
          <div key={idx} className="text-center">
            <p className="text-xs font-medium text-gray-600">{stat.label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
