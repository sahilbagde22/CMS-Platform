'use client';

import Card from '@/components/shared/Card';
import Button from '@/components/shared/Button';
import StatusBadge from '@/components/shared/StatusBadge';
import { Employee } from '@/lib/types';
import { Search, Download, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface EmployeesViewProps {
  employees: Employee[];
  onFilter?: (criteria: string) => void;
  onExport?: () => void;
}

export default function EmployeesView({
  employees,
  onFilter,
  onExport,
}: EmployeesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.project.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const utilization = (value: number) => {
    let bgColor = 'bg-green-100';
    if (value < 50) bgColor = 'bg-red-100';
    else if (value < 75) bgColor = 'bg-amber-100';

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${bgColor} transition-all`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="w-12 text-right text-sm font-medium">{value}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-8">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search employees, roles, projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onFilter}>
            Filter
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                  Project
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                  Utilization
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee, idx) => (
                <tr
                  key={employee.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                        {employee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{employee.role}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{employee.project}</td>
                  <td className="px-6 py-4">{utilization(employee.utilization)}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={employee.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer stats */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredEmployees.length}</span> of{' '}
            <span className="font-semibold">{employees.length}</span> employees
          </p>
        </div>
      </Card>
    </div>
  );
}
