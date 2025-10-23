import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Clock, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig = {
  draft: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: FolderOpen },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800", icon: Clock },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800", icon: CheckCircle },
  failed: { label: "Falhou", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

export default function ProjectCard({ project }) {
  const config = statusConfig[project.status] || statusConfig.draft;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{project.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={config.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-sm text-gray-500">
                {project.total_products} produtos
              </span>
            </div>
          </div>
          <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
            <Button size="sm" variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
          </Link>
        </div>

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

        <p className="text-xs text-gray-400 mt-4">
          Criado em {format(new Date(project.created_date), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
}