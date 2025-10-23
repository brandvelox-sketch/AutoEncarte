import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrações Google</CardTitle>
          <CardDescription>Configure as APIs do Google necessárias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Google Custom Search API</h3>
            <p className="text-sm text-gray-600">
              Usada para buscar imagens relacionadas aos produtos.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Variáveis: GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Google Gemini API</h3>
            <p className="text-sm text-gray-600">
              Usada para validar se as imagens correspondem aos produtos.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Variável: GOOGLE_GEMINI_API_KEY
            </p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Google Drive API</h3>
            <p className="text-sm text-gray-600">
              Usada como banco de imagens certificadas.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Variáveis: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> As chaves de API são configuradas automaticamente nas Edge Functions do Supabase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
