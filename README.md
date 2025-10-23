# Auto Encarte Pro

Sistema de gerenciamento de encartes com integração com APIs do Google.

## Estrutura do Projeto

### Backend (Supabase)

#### Banco de Dados
- `profiles` - Perfis de usuários (admin/operator)
- `projects` - Projetos de encartes
- `products` - Produtos dos encartes
- `certified_images` - Banco de imagens certificadas

#### Edge Functions
1. **google-image-search** - Busca de imagens via Google Custom Search API
2. **validate-image-gemini** - Validação de imagens usando Google Gemini AI
3. **google-drive-manager** - Gerenciamento de arquivos no Google Drive

### Frontend (React + Vite)

#### Páginas
- Dashboard - Visão geral dos projetos
- Novo Projeto - Criação de encartes
- Detalhes do Projeto - Visualização e edição
- Banco de Imagens - Galeria de imagens certificadas
- Gerenciar Usuários - Administração de usuários (admin)
- Configurações - Configurações do sistema (admin)

## Configuração

### Variáveis de Ambiente

O arquivo `.env` já está configurado com as credenciais do Supabase.

### APIs do Google (Configuradas nas Edge Functions)

As seguintes variáveis devem estar configuradas no Supabase:

1. **Google Custom Search API**
   - `GOOGLE_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`

2. **Google Gemini API**
   - `GOOGLE_GEMINI_API_KEY`

3. **Google Drive API** (Service Account)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

## Como Obter as Chaves

### Google Custom Search API
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a "Custom Search API"
4. Crie uma chave de API
5. Configure um Search Engine em [Programmable Search Engine](https://programmablesearchengine.google.com/)

### Google Gemini API
1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma chave de API para o Gemini

### Google Drive API (Service Account)
1. No Google Cloud Console, vá para "APIs & Services" > "Credentials"
2. Crie uma Service Account
3. Gere uma chave JSON
4. Use o email e private key da service account

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Funcionalidades

### Operador
- Criar e gerenciar projetos de encartes
- Adicionar produtos aos encartes
- Buscar imagens via Google
- Validar imagens com IA
- Acessar banco de imagens certificadas

### Administrador
- Todas as funcionalidades de operador
- Gerenciar usuários
- Configurar sistema
- Visualizar todos os projetos

## Autenticação

O sistema usa Supabase Auth com email/password. Os usuários são criados através do painel do Supabase e seus perfis são gerenciados na tabela `profiles`.

## Tecnologias

- **Frontend**: React, Vite, TailwindCSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **APIs**: Google Custom Search, Google Gemini AI, Google Drive
- **Autenticação**: Supabase Auth
