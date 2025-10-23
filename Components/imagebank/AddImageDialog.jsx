import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AddImageDialog({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    product_name: "",
    category: "",
    description: "",
    tags: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const createImageMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      return base44.entities.CertifiedImage.create({
        product_name: data.product_name,
        normalized_name: normalizeString(data.product_name),
        image_url: file_url,
        category: data.category || undefined,
        description: data.description || undefined,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        usage_count: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certifiedImages'] });
      onClose();
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_name.trim()) {
      setError("Nome do produto é obrigatório");
      return;
    }
    
    if (!file) {
      setError("Selecione uma imagem");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await createImageMutation.mutateAsync(formData);
    } catch (err) {
      setError("Erro ao adicionar imagem. Tente novamente.");
    }
    
    setIsUploading(false);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Adicionar Imagem Certificada</DialogTitle>
      </DialogHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="product_name">Nome do Produto *</Label>
          <Input
            id="product_name"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            placeholder="Ex: Coca-Cola 2L"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Ex: Bebidas"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Informações adicionais sobre o produto"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
          <Input
            id="tags"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Ex: bebida, refrigerante, coca"
            disabled={isUploading}
          />
        </div>

        <div className="space-y-2">
          <Label>Imagem *</Label>
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            {preview ? (
              <div className="space-y-3">
                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  disabled={isUploading}
                >
                  Trocar Imagem
                </Button>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-3">
                  Clique para selecionar uma imagem
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="max-w-xs mx-auto"
                />
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Adicionando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}