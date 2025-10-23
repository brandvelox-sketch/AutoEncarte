import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService, productService } from '@/services/api';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Image as ImageIcon,
  Package,
  TrendingUp
} from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800', icon: Clock },
  searching_bank: { label: 'Buscando no Banco', color: 'bg-blue-100 text-blue-800', icon: Search },
  searching_web: { label: 'Buscando na Web', color: 'bg-purple-100 text-purple-800', icon: Search },
  validating: { label: 'Validando', color: 'bg-yellow-100 text-yellow-800', icon: ImageIcon },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const projectStatusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-800' },
};

export default function ProjectDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [realtimeProducts, setRealtimeProducts] = useState([]);

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProject(id),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getProducts(id),
    enabled: !!id,
  });

  const startProcessingMutation = useMutation({
    mutationFn: (projectId) => projectService.startProjectProcessing(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });

  // Configurar Supabase Realtime para produtos
  useEffect(() => {
    if (!id) return;

    setRealtimeProducts(products);

    const channel = supabase
      .channel(`products-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `project_id=eq.${id}`,
        },
        (payload) => {
          console.log('Product updated:', payload);
          
          if (payload.eventType === 'UPDATE') {
            setRealtimeProducts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          } else if (payload.eventType === 'INSERT') {
            setRealtimeProducts((prev) => [...prev, payload.new]);
          }
          
          // Invalidar queries para atualizar o projeto
          queryClient.invalidateQueries({ queryKey: ['project', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, products, queryClient]);

  // Configurar Realtime para o projeto
  useEffect(() => {
    if (!id) return;

    const projectChannel = supabase
      .channel(`project-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['project', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectChannel);
    };
  }, [id, queryClient]);

  if (loadingProject || loadingProducts) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Projeto não encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayProducts = realtimeProducts.length > 0 ? realtimeProducts : products;
  const completedProducts = displayProducts.filter(p => p.status === 'completed').length;
  const progressPercentage = displayProducts.length > 0 
    ? (completedProducts / displayProducts.length) * 100 
    : 0;

  const canStartProcessing = project.status === 'draft' || project.status === 'failed';
  const isProcessing = project.status === 'processing';

  const projectConfig = projectStatusConfig[project.status] || projectStatusConfig.draft;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <Badge className={projectConfig.color}>
              {projectConfig.label}
            </Badge>
          </div>
          <p className="text-gray-600">{project.description || 'Sem descrição'}</p>
        </div>
        
        {canStartProcessing && (
          <Button
            onClick={() => startProcessingMutation.mutate(id)}
            disabled={startProcessingMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {startProcessingMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processando...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Busca de Imagens
              </>
            )}
          </Button>
        )}
      </div>

      {/* Estatísticas do Projeto */}
      {(project.status === 'processing' || project.status === 'completed') && (
        <Card className="border-2 border-blue-200 bg-blue-50/50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Progresso do Processamento</h3>
                <span className="text-2xl font-bold text-blue-600">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              
              <Progress value={progressPercentage} className="h-3" />
              
              <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Package className="w-4 h-4 text-gray-600" />
                    <p className="text-2xl font-bold text-gray-900">
                      {displayProducts.length}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">Total de Produtos</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">
                      {project.products_from_bank || 0}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">Do Banco</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">
                      {project.products_from_web || 0}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">Da Web</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <p className="text-2xl font-bold text-red-600">
                      {project.products_failed || 0}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">Falhas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isProcessing && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>⚡ Processamento em andamento!</strong> As imagens estão sendo buscadas e validadas automaticamente. 
            A página será atualizada em tempo real.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>
            {displayProducts.length} {displayProducts.length === 1 ? 'produto' : 'produtos'} neste encarte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum produto adicionado ainda
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayProducts.map(product => {
                const config = statusConfig[product.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {product.image_url ? (
                        <>
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ESem imagem%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          {product.image_source === 'certified_bank' && (
                            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              Banco Certificado
                            </div>
                          )}
                          {product.image_source === 'web_validated' && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              Web Validada
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {product.price > 0 && (
                          <p className="text-lg font-bold text-blue-600">
                            R$ {product.price.toFixed(2)}
                          </p>
                        )}
                        
                        <Badge className={config.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      {product.error_message && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">
                            {product.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}