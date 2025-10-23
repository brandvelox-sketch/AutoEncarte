import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certifiedImageService } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Plus, Upload } from 'lucide-react';
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
    (image.tags && image.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Biblioteca de Imagens</h1>
            <p className="text-gray-600 mt-1">{images.length} imagens validadas e reutilizáveis</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Adicionar em Lote
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Imagem
            </Button>
          </div>
        </div>

        <div className="relative">
          <Input
            placeholder="Buscar por nome ou tags..."
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
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">Nenhuma imagem encontrada</h3>
            <p className="text-gray-500 mt-2">Tente uma busca diferente ou adicione novas imagens.</p>
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
        <DialogContent>
          <AddImageDialog onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-3xl">
          <BulkUploadDialog onClose={() => setBulkDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}