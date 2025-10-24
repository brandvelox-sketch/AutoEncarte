import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FolderOpen, Clock, CheckCircle, AlertCircle, ExternalLink, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: FolderOpen },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: Clock },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800", icon: CheckCircle },
  failed: { label: "Falhou", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

export default function ProjectCard({ project: initialProject }) {
  const [project, setProject] = useState(initialProject);
  const config = statusConfig[project.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  // Calcular progresso
  const totalProducts = project.total_products || 0;
  const completedProducts = project.products_completed || 0;
  const progressPercentage = totalProducts > 0 
    ? (completedProducts / totalProducts) * 100 
    : 0;

  // Configurar Realtime para este projeto
  useEffect(() => {
    const channel = supabase
      .channel(`project-card-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${project.id}`,
        },
        (payload) => {
          console.log('Project updated in card:', payload);
          setProject(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-white overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={config.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-sm text-gray-500">
                {totalProducts} {totalProducts === 1 ? 'produto' : 'produtos'}
              </span>
            </div>
          </div>
          <Link to={`/project/${project.id}`}>
            <Button size="sm" variant="outline" className="gap-2 hover:bg-blue-50 hover:border-blue-300">
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
          </Link>
        </div>

        {/* Barra de Progresso para Projetos em Processamento */}
        {project.status === 'processing' && totalProducts > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Progresso</span>
              <span className="text-xs font-bold text-blue-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {completedProducts} de {totalProducts} produtos processados
            </p>
          </div>
        )}

        {/* Estatísticas para Projetos Concluídos */}
        {project.status === 'completed' && (
          <div className="grid grid-cols-3 gap-2 text-sm pt-4 border-t">
            <div className="text-center">
              <p className="font-semibold text-green-600">{project.products_from_bank || 0}</p>
              <p className="text-xs text-gray-500">Banco</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-blue-600">{project.products_from_web || 0}</p>
              <p className="text-xs text-gray-500">Web</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-red-600">{project.products_failed || 0}</p>
              <p className="text-xs text-gray-500">Falhas</p>
            </div>
          </div>
        )}

        {/* Animação de Processamento */}
        {project.status === 'processing' && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">Processando automaticamente...</span>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4 pt-4 border-t">
          Criado em {format(new Date(project.created_at || project.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}