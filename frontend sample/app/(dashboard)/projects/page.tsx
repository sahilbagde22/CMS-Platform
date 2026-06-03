'use client';

import { mockProjects } from '@/lib/mockData';
import ProjectsView from '@/components/dashboard/ProjectsView';

export default function ProjectsPage() {
  const handleAllocate = (projectId: string, allocation: number) => {
    console.log(`Allocating for project ${projectId}:`, allocation);
  };

  return <ProjectsView projects={mockProjects} onAllocate={handleAllocate} />;
}
