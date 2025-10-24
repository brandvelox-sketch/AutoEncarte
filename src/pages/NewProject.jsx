import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse'; // Importar a biblioteca
import { projectService, productService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ManualProductEntry from '@/components/Components/new project/ManualProductEntry';
import FileDropzone from '@/components/Components/new project/FileDropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function NewProject() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  const createProjectMutation = useMutation({
    mutationFn: (data) => projectService.createProject(data),
  });

  const createProductMutation = useMutation({
    mutationFn: (data) => productService.createProduct(data),
  });

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setError(null);
    if (file) {
      // Implementação real do parse de CSV
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError('Ocorreu um erro ao ler o arquivo CSV. Verifique o formato.');
            setProducts([]);
            return;
          }
          // Supondo que o CSV tenha colunas 'name', 'description', 'price'
          const parsedProducts = results.data.map((row) => ({
            name: row.name || '',
            description: row.description || '',
            price: row.price ? `R$ ${String(row.price).trim()}` : 'R$ 0,00',
          }));
          setProducts(parsedProducts);
        },
      });
    } else {
      setProducts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || products.length === 0) {
      setError('O nome do encarte e pelo menos um produto são obrigatórios.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // 1. Criar o projeto principal
      const newProject = await createProjectMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        status: 'draft',
        total_products: products.length,
      });

      // 2. Criar cada produto associado ao projeto em paralelo
      const productCreationPromises = products.map((product, index) => {
        const priceString = String(product.price || '0').replace('R$', '').trim().replace(',', '.');
        const priceNumber = parseFloat(priceString);

        return createProductMutation.mutateAsync({
          project_id: newProject.id,
          name: product.name,
          description: product.description,
          price: isNaN(priceNumber) ? 0 : priceNumber,
          status: 'pending',
          order: index,
        });
      });

      await Promise.all(productCreationPromises);

      // 3. Se tudo deu certo, invalidar o cache e navegar
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate(`/project/${newProject.id}`);
      
    } catch (err) {
      // 4. Se qualquer passo falhar, capturar o erro e mostrar ao usuário
      console.error("Erro ao criar projeto ou produtos:", err);
      setError(err.message || "Ocorreu uma falha. Verifique os dados e tente novamente.");
    } finally {
      // 5. Parar o estado de "loading"
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Criar Novo Encarte</h1>
        <p className="text-gray-600 mt-1">Configure seu novo encarte de ofertas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>1. Informações do Encarte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Encarte</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ofertas Semana 47 - Dezembro 2024"
                required
                disabled={isCreating}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo deste encarte..."
                className="flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                disabled={isCreating}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>2. Adicionar Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
                <TabsTrigger value="upload">Upload de Arquivo</TabsTrigger>
              </TabsList>
              <TabsContent value="manual">
                <ManualProductEntry
                  products={products}
                  setProducts={setProducts}
                  disabled={isCreating}
                />
              </TabsContent>
              <TabsContent value="upload">
                <FileDropzone
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  disabled={isCreating}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={isCreating || !name.trim() || products.length === 0}
          >
            {isCreating ? 'Criando...' : `Criar Encarte (${products.length} produtos)`}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={isCreating}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}