import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";

export default function BulkUploadDialog({ onClose }) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);

  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
  };

  const getProductNameFromFilename = (filename) => {
    // Remove extensão e normaliza
    return filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .trim();
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (selectedFiles.length === 0) {
      setError("Selecione apenas arquivos de imagem");
      return;
    }

    setFiles(selectedFiles);
    setUploadProgress(Array(selectedFiles.length).fill(0));
    setUploadResults([]);
    setError(null);
  };

  const uploadFile = async (file, index) => {
    try {
      setUploadProgress(prev => {
        const newProgress = [...prev];
        newProgress[index] = 50;
        return newProgress;
      });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const productName = getProductNameFromFilename(file.name);
      
      await base44.entities.CertifiedImage.create({
        product_name: productName,
        normalized_name: normalizeString(productName),
        image_url: file_url,
        usage_count: 0,
      });

      setUploadProgress(prev => {
        const newProgress = [...prev];
        newProgress[index] = 100;
        return newProgress;
      });

      return { success: true, filename: file.name, productName };
    } catch (error) {
      return { success: false, filename: file.name, error: error.message };
    }
  };

  const handleBulkUpload = async () => {
    setIsUploading(true);
    setError(null);
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const result = await uploadFile(files[i], i);
      results.push(result);
      setUploadResults([...results]);
    }

    queryClient.invalidateQueries({ queryKey: ['certifiedImages'] });
    setIsUploading(false);
  };

  const successCount = uploadResults.filter(r => r.success).length;
  const failCount = uploadResults.filter(r => !r.success).length;
  const isComplete = uploadResults.length === files.length && files.length > 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Upload em Lote de Imagens</DialogTitle>
      </DialogHeader>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          <strong>💡 Dica:</strong> O nome do produto será extraído automaticamente do nome do arquivo. 
          Use nomes descritivos como "coca-cola-2l.jpg" ou "arroz_tio_joao_5kg.png"
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4 pt-4">
        {files.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="font-semibold text-gray-700 mb-2">
              Selecione múltiplas imagens
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Você pode selecionar várias imagens de uma vez
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="bulk-upload-input"
              disabled={isUploading}
            />
            <label htmlFor="bulk-upload-input">
              <Button type="button" asChild>
                <span>Selecionar Imagens</span>
              </Button>
            </label>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {files.length} arquivo(s) selecionado(s)
              </p>
              {!isUploading && uploadResults.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiles([]);
                    setUploadProgress([]);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {files.map((file, index) => {
                const result = uploadResults[index];
                const progress = uploadProgress[index] || 0;
                
                return (
                  <Card key={index} className={
                    result?.success ? "border-green-200 bg-green-50" :
                    result?.success === false ? "border-red-200 bg-red-50" :
                    "border-gray-200"
                  }>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {result?.success ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : result?.success === false ? (
                            <AlertCircle className="w-6 h-6 text-red-600" />
                          ) : (
                            <Upload className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          {result?.productName && (
                            <p className="text-xs text-gray-600">
                              Produto: {result.productName}
                            </p>
                          )}
                          {!result && isUploading && (
                            <Progress value={progress} className="h-1 mt-2" />
                          )}
                          {result?.success === false && (
                            <p className="text-xs text-red-600 mt-1">
                              Erro: {result.error}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {isComplete && (
              <Alert className={successCount === files.length ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                <AlertDescription className={successCount === files.length ? "text-green-800" : "text-yellow-800"}>
                  <strong>Upload concluído!</strong> {successCount} imagem(s) adicionada(s) com sucesso
                  {failCount > 0 && `, ${failCount} falhou(s)`}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isUploading}
        >
          {isComplete ? 'Fechar' : 'Cancelar'}
        </Button>
        {files.length > 0 && !isComplete && (
          <Button
            onClick={handleBulkUpload}
            disabled={isUploading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Fazendo Upload...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload de Todos
              </>
            )}
          </Button>
        )}
      </div>
    </>
  );
}