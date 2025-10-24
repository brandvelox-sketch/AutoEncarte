import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certifiedImageService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Upload, Search, ImageIcon, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import ImageCard from '@/components/Components/imagebank/ImageCard';
import AddImageDialog from '@/components/Components/imagebank/AddImageDialog';
import BulkUploadDialog from '@/components/Components/imagebank/BulkUploadDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ImageBank() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['certifiedImages'],
    queryFn: () => certifiedImageService.getImages(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => certifiedImageService.deleteImage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifiedImages'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => certifiedImageService.syncWithDrive(),
    onSuccess: (data) => {
      setSyncResult(data);
      setSyncError(null);
      queryClient.invalidateQueries({ queryKey: ['certifiedImages'] });
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => setSyncResult(null), 5000);
    },
    onError: (error) => {
      setSyncError(error.message);
      setSyncResult(null);
    },
  });

  const handleSync = () => {
    setSyncError(null);
    setSyncResult(null);
    syncMutation.mutate();
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta imagem?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredImages = images.filter(image =>
    (image.product_name && image.product_name.toLowerCase().includes(search.toLowerCase())) ||
    (image.tags && image.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))) ||
    (image.category && image.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Biblioteca de Imagens
            </h1>
            <p className="text-gray-600 mt-1">
              {images.length} {images.length === 1 ? 'imagem' : 'imagens'} na biblioteca
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              {syncMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronizar com Drive
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setBulkDialogOpen(true)}
              className="hover:bg-purple-50 hover:border-purple-300"
            >
              <Upload className="w-4 h-4 mr-2" />
              Adicionar em Lote
            </Button>
            <Button 
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Imagem
            </Button>
          </div>
        </div>
        
        {/* Mensagem de Sucesso na Sincronização */}
        {syncResult && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Sincronização Concluída!</AlertTitle>
            <AlertDescription className="text-green-800">
              <p className="font-semibold">{syncResult.message}</p>
              <div className="mt-2 text-sm">
                <p>✅ Novas imagens: {syncResult.added}</p>
                <p>⏭️ Já existentes: {syncResult.skipped}</p>
                <p>📊 Total no Drive: {syncResult.total}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mensagem de Erro na Sincronização */}
        {syncError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro de Sincronização</AlertTitle>
            <AlertDescription>
              <p className="font-semibold mb-2">{syncError}</p>
              <div className="text-sm space-y-1">
                <p><strong>Possíveis causas:</strong></p>
                <ul className="list-disc list-inside ml-2">
                  <li>A variável GOOGLE_CREDENTIALS_BASE64 não está configurada no Supabase</li>
                  <li>A Service Account não tem permissão para acessar a pasta do Drive</li>
                  <li>O ID da pasta está incorreto</li>
                </ul>
                <p className="mt-2">
                  <strong>Como resolver:</strong> Vá em Project Settings → Edge Functions → Secrets no Supabase
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por nome, categoria ou tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <ImageIcon className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {search ? 'Nenhuma imagem encontrada' : 'Nenhuma imagem na biblioteca'}
            </h3>
            <p className="text-gray-500 mb-6">
              {search 
                ? 'Tente uma busca diferente ou adicione novas imagens.' 
                : 'Comece adicionando imagens ou sincronize com o Google Drive.'}
            </p>
            {!search && (
              <Button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar com Drive
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredImages.map(image => (
              <ImageCard key={image.id} image={image} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <AddImageDialog onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <BulkUploadDialog onClose={() => setBulkDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}