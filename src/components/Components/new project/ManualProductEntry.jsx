import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ManualProductEntry({ products, setProducts, disabled }) {
  const [textInput, setTextInput] = useState("");
  const [parseError, setParseError] = useState(null);

  const parseProductList = (text) => {
    if (!text.trim()) {
      setParseError("Cole a lista de produtos no formato correto");
      return;
    }

    const lines = text.split('\n').filter(line => line.trim());
    const parsedProducts = [];
    let errors = 0;

    for (const line of lines) {
      try {
        // Divide por múltiplos traços (---)
        const dashIndex = line.indexOf('---');
        
        if (dashIndex === -1) {
          errors++;
          continue;
        }

        // Nome do produto é tudo antes dos traços
        const name = line.substring(0, dashIndex).trim();
        
        // Resto da linha após os traços
        const remainder = line.substring(dashIndex).replace(/^-+/, '').trim();
        
        // Separa preço e código
        // Formato: PREÇO    CÓDIGO
        const parts = remainder.split(/\s{2,}/); // Split por 2 ou mais espaços
        
        if (parts.length < 1) {
          errors++;
          continue;
        }

        const price = parts[0]?.trim() || "";
        const code = parts[1]?.trim() || "";

        if (name) {
          parsedProducts.push({
            name: name,
            description: code ? `Código: ${code}` : "",
            price: price ? `R$ ${price}` : "",
          });
        }
      } catch (error) {
        errors++;
      }
    }

    if (parsedProducts.length === 0) {
      setParseError("Não foi possível extrair nenhum produto. Verifique o formato.");
      return;
    }

    setProducts(parsedProducts);
    setParseError(null);
    
    if (errors > 0) {
      setParseError(`${parsedProducts.length} produtos extraídos com sucesso. ${errors} linha(s) ignorada(s).`);
    }
  };

  const handleParse = () => {
    parseProductList(textInput);
  };

  const handleClear = () => {
    setTextInput("");
    setProducts([]);
    setParseError(null);
  };

  return (
    <div className="space-y-6">
      {products.length === 0 ? (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Cole a Lista de Produtos
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cole sua lista no formato: <br/>
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                PRODUTO ------------------------ PREÇO    CÓDIGO
              </code>
            </p>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="productList">Lista de Produtos</Label>
                <Textarea
                  id="productList"
                  placeholder="Cole aqui sua lista de produtos...
Exemplo:
FRANGO CONGELADO KG ------------------------------ 8,99    357
COXINHA DE FRANGO AVIGRO TEMP PCT 1KG---- 17,99    46934
COXA DE FRANGO AVIGRO OU SEARA BDJ 1KG--- 13,99    46922/35319"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={disabled}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              {parseError && (
                <Alert variant={parseError.includes("sucesso") ? "default" : "destructive"}>
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="button"
                onClick={handleParse}
                disabled={!textInput.trim() || disabled}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Processar Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">
                    {products.length} Produtos Processados
                  </h3>
                  <p className="text-sm text-green-700">
                    Revise a lista abaixo antes de criar o projeto
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={disabled}
                className="w-full"
              >
                Limpar e Inserir Nova Lista
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-gray-500 text-sm">
                            {index + 1}.
                          </span>
                          <h4 className="font-semibold text-gray-900">
                            {product.name}
                          </h4>
                        </div>
                        <div className="flex gap-4 mt-1 ml-6">
                          {product.price && (
                            <p className="text-sm font-medium text-blue-600">
                              {product.price}
                            </p>
                          )}
                          {product.description && (
                            <p className="text-sm text-gray-600">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Dica:</strong> Cada linha deve ter o formato: 
            <code className="mx-1 px-2 py-1 bg-blue-100 rounded text-xs">
              NOME DO PRODUTO --- PREÇO    CÓDIGO
            </code>
          </p>
          <p className="text-xs text-blue-700 mt-2">
            Os traços (---) separam o nome do preço. O código é opcional e será salvo na descrição.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}