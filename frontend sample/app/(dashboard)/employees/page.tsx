'use client';

import { mockEmployees } from '@/lib/mockData';
import EmployeesView from '@/components/dashboard/EmployeesView';

export default function EmployeesPage() {
  const handleFilter = () => {
    console.log('Filter clicked');
  };

  const handleExport = () => {
    console.log('Export clicked');
  };

  return (
    <EmployeesView employees={mockEmployees} onFilter={handleFilter} onExport={handleExport} />
  );
}
