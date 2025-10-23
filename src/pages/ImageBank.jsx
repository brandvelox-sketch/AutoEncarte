import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { certifiedImageService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ImageBank() {
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['certifiedImages'],
    queryFn: () => certifiedImageService.getImages(),
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Banco de Imagens</h1>
        <p className="text-gray-600 mt-1">Imagens certificadas e validadas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Imagens Certificadas</CardTitle>
          <CardDescription>
            {images.length} {images.length === 1 ? 'imagem' : 'imagens'} disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma imagem certificada ainda
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {images.map(image => (
                <div key={image.id} className="border rounded-lg overflow-hidden">
                  <img
                    src={image.thumbnail_url || image.url}
                    alt={image.filename}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{image.filename}</p>
                    {image.category && (
                      <p className="text-xs text-gray-600 mt-1">{image.category}</p>
                    )}
                    {image.validated && (
                      <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Validada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
