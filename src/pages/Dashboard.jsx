import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/services/api';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ProjectCard from '@/components/Components/dashboard/ProjectCard'; // Usando o card estilizado

export default function Dashboard() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Gerencie seus encartes e automatize sua produção</p>
        </div>
        <Link to="/new-project">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Encarte
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold text-gray-800">Nenhum encarte encontrado</h3>
          <p className="text-gray-500 mt-2">Comece a criar seu primeiro encarte agora mesmo.</p>
          <Link to="/new-project" className="mt-4 inline-block">
            <Button>Criar Primeiro Encarte</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}