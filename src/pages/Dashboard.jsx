import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, FolderOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import ProjectCard from '@/components/Components/dashboard/ProjectCard';
import StatsCard from '@/components/Components/dashboard/StatsCard';

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });

  // Configurar Realtime para projetos
  useEffect(() => {
    const channel = supabase
      .channel('projects-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calcular estatísticas
  const totalProjects = projects.length;
  const processingProjects = projects.filter(p => p.status === 'processing').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const failedProjects = projects.filter(p => p.status === 'failed').length;

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Gerencie seus encartes e automatize sua produção</p>
        </div>
        <Link to="/new-project">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Novo Encarte
          </Button>
        </Link>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total de Projetos"
          value={totalProjects}
          icon={FolderOpen}
          gradient="from-blue-500 to-blue-600"
        />
        <StatsCard
          title="Em Processamento"
          value={processingProjects}
          icon={Clock}
          gradient="from-yellow-500 to-orange-600"
        />
        <StatsCard
          title="Concluídos"
          value={completedProjects}
          icon={CheckCircle}
          gradient="from-green-500 to-emerald-600"
        />
        <StatsCard
          title="Com Falhas"
          value={failedProjects}
          icon={XCircle}
          gradient="from-red-500 to-rose-600"
        />
      </div>

      {/* Lista de Projetos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Seus Projetos</h2>
          {projects.length > 0 && (
            <p className="text-sm text-gray-500">
              Mostrando {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
            </p>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FolderOpen className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum encarte encontrado</h3>
            <p className="text-gray-500 mb-6">Comece a criar seu primeiro encarte agora mesmo.</p>
            <Link to="/new-project">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Encarte
              </Button>
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
    </div>
  );
}