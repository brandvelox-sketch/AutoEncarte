import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certifiedImageService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Upload, Search, ImageIcon } from 'lucide-react';
import ImageCard from '@/components/Components/imagebank/ImageCard';
import AddImageDialog from '@/components/Components/imagebank/AddImageDialog';
import BulkUploadDialog from '@/components/Components/imagebank/BulkUploadDialog';

export default function ImageBank() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

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

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta imagem?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredImages = images.filter(image =>
    image.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (image.tags && image.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))) ||
    (image.category && image.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Biblioteca de Imagens
            </h1>
            <p className="text-gray-600 mt-1">
              {images.length} {images.length === 1 ? 'imagem validada' : 'imagens validadas'} e reutilizáveis
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Barra de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Buscar por nome, categoria ou tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid de Imagens */}
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
                : 'Comece adicionando imagens certificadas para reutilizar em seus encartes.'}
            </p>
            {!search && (
              <Button 
                onClick={() => setAddDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Imagem
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

      {/* Diálogo de Adicionar Imagem */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <AddImageDialog onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de Upload em Lote */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <BulkUploadDialog onClose={() => setBulkDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}