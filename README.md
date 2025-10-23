# Auto Encarte Pro - Sistema Completo de Automação

Sistema completo de gerenciamento de encartes com automação de busca e validação de imagens usando IA.

## ✨ Funcionalidades Implementadas

### 🚀 Automação Completa
- ✅ Busca automática de imagens no banco certificado
- ✅ Busca de imagens na web via Google Custom Search
- ✅ Validação de imagens com Google Gemini AI
- ✅ Processamento em background com Edge Functions
- ✅ Atualização em tempo real com Supabase Realtime

### 📸 Gestão de Imagens
- ✅ Upload de imagens para Supabase Storage
- ✅ Biblioteca de imagens certificadas
- ✅ Upload em lote de múltiplas imagens
- ✅ Busca e filtragem por tags e categorias
- ✅ Rastreamento de uso de imagens

### 📊 Interface Moderna
- ✅ Dashboard com estatísticas em tempo real
- ✅ Cards visuais para projetos e imagens
- ✅ Barras de progresso durante processamento
- ✅ Feedback visual instantâneo
- ✅ Design responsivo e moderno

## 🛠️ Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Supabase Storage
1. Acesse https://app.supabase.com
2. Vá para Storage > Buckets
3. Crie um bucket público chamado `certified-images`
4. Configure as políticas de acesso (ver instruções detalhadas acima)

### 3. Executar Migração do Banco de Dados
```bash
# Se usando Supabase CLI local
supabase db push

# Ou copie o conteúdo do arquivo de migração e execute no SQL Editor do Supabase
```

### 4. Deploy das Edge Functions
```bash
# Deploy da função de processamento
supabase functions deploy process-project

# Deploy das outras funções (se ainda não estiver feito)
supabase functions deploy google-image-search
supabase functions deploy validate-image-gemini
supabase functions deploy google-drive-manager
```

### 5. Configurar Variáveis de Ambiente
No Supabase Dashboard (Project Settings > Edge Functions):
- `GOOGLE_API_KEY`
- `GOOGLE_SEARCH_ENGINE_ID`
- `GOOGLE_GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 6. Executar o Projeto
```bash
npm run dev
```

## 📖 Como Usar

### Criar um Novo Encarte
1. Clique em "Novo Encarte" no Dashboard
2. Insira o nome e descrição
3. Cole a lista de produtos ou faça upload de CSV
4. Clique em "Criar Encarte"

### Processar Imagens Automaticamente
1. Abra o projeto criado
2. Clique em "Iniciar Busca de Imagens"
3. Acompanhe o progresso em tempo real
4. Revise os resultados quando concluído

### Adicionar Imagens Certificadas
1. Vá para "Biblioteca de Imagens"
2. Clique em "Adicionar Imagem" ou "Adicionar em Lote"
3. Faça upload e preencha os metadados
4. As imagens serão priorizadas em futuros processamentos

## 🎯 Fluxo de Processamento
1. Usuário cria projeto com lista de produtos
2. Clica em "Iniciar Busca de Imagens"
3. Para cada produto:
a. Busca no banco certificado (normalizado)
b. Se não encontrar, busca na web (Google)
c. Valida imagem com Gemini AI
d. Salva melhor resultado
4. Atualiza estatísticas do projeto
5. Interface atualiza em tempo real

## 🔧 Arquitetura Técnica

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool e dev server
- **TailwindCSS** - Estilização
- **Radix UI** - Componentes acessíveis
- **React Query** - Gerenciamento de estado e cache
- **React Router** - Navegação

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL - Banco de dados
  - Authentication - Autenticação JWT
  - Storage - Armazenamento de arquivos
  - Realtime - WebSocket subscriptions
  - Edge Functions - Serverless functions (Deno)

### APIs Externas
- **Google Custom Search API** - Busca de imagens
- **Google Gemini AI** - Validação de imagens
- **Google Drive API** - Armazenamento alternativo (opcional)

## 📁 Estrutura de Arquivos
```
auto-encarte-pro/
├── src/
│   ├── api/
│   │   └── base44Client.js           # Bridge para upload de imagens
│   ├── components/
│   │   ├── Components/
│   │   │   ├── dashboard/
│   │   │   │   ├── ProjectCard.jsx   # Card de projeto com Realtime
│   │   │   │   └── StatsCard.jsx     # Card de estatísticas
│   │   │   ├── imagebank/
│   │   │   │   ├── AddImageDialog.jsx      # Modal de adicionar imagem
│   │   │   │   ├── BulkUploadDialog.jsx    # Modal de upload em lote
│   │   │   │   └── ImageCard.jsx           # Card de imagem
│   │   │   ├── new project/
│   │   │   │   ├── FileDropzone.jsx        # Dropzone para CSV
│   │   │   │   └── ManualProductEntry.jsx  # Entrada manual de produtos
│   │   │   └── usermanagement/
│   │   │       └── UserCard.jsx            # Card de usuário
│   │   └── ui/                       # Componentes base (shadcn/ui)
│   ├── hooks/
│   │   └── useAuth.jsx               # Hook de autenticação
│   ├── lib/
│   │   └── supabase.js               # Cliente Supabase
│   ├── pages/
│   │   ├── Dashboard.jsx             # Dashboard com estatísticas
│   │   ├── ImageBank.jsx             # Biblioteca de imagens
│   │   ├── Login.jsx                 # Página de login
│   │   ├── NewProject.jsx            # Criar novo projeto
│   │   ├── ProjectDetails.jsx        # Detalhes do projeto + Realtime
│   │   ├── Settings.jsx              # Configurações
│   │   └── UserManagement.jsx        # Gerenciar usuários
│   ├── services/
│   │   └── api.js                    # Serviços de API
│   ├── utils/
│   │   └── index.js                  # Utilitários
│   ├── App.jsx                       # Componente raiz
│   ├── Layout.jsx                    # Layout principal
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Estilos globais
├── supabase/
│   ├── functions/
│   │   ├── google-image-search/      # Busca de imagens
│   │   ├── google-drive-manager/     # Gerenciador Drive
│   │   ├── process-project/          # 🆕 Motor de automação
│   │   └── validate-image-gemini/    # Validação com IA
│   └── migrations/
│       ├── 20251023183119_create_initial_schema.sql
│       └── 20251024000000_update_schema_for_automation.sql
├── .env                              # Variáveis de ambiente
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🔄 Fluxo de Dados Realtime
```
Supabase Database Change
         ↓
Realtime Channel (WebSocket)
         ↓
React Component Subscription
         ↓
State Update (useState)
         ↓
UI Re-render
```

### Canais Realtime Implementados

1. **Dashboard** - Escuta mudanças em `projects`
2. **ProjectDetails** - Escuta mudanças em `projects` e `products`
3. **ProjectCard** - Escuta mudanças no projeto específico

## 🎨 Componentes Principais

### StatsCard
```jsx
<StatsCard
  title="Total de Projetos"
  value={10}
  icon={FolderOpen}
  gradient="from-blue-500 to-blue-600"
/>
```

### ProjectCard
```jsx
<ProjectCard project={projectData} />
// Atualiza automaticamente quando o projeto muda
```

### ImageCard
```jsx
<ImageCard 
  image={imageData} 
  onDelete={(id) => handleDelete(id)} 
/>
```

## 🔐 Segurança

### Row Level Security (RLS)
Todas as tabelas têm RLS habilitado:

- **profiles** - Usuários veem apenas seu próprio perfil (admins veem todos)
- **projects** - Usuários veem apenas seus projetos (admins veem todos)
- **products** - Acesso baseado na propriedade do projeto
- **certified_images** - Todos veem, apenas donos editam/deletam

### Storage Policies
- **Upload** - Apenas usuários autenticados
- **Leitura** - Público
- **Deleção** - Apenas dono do arquivo

## 🚀 Edge Functions

### process-project
**Propósito:** Orquestrar o processamento completo de um projeto

**Fluxo:**
1. Recebe `project_id`
2. Busca todos os produtos
3. Para cada produto:
   - Verifica banco certificado
   - Busca na web se necessário
   - Valida com Gemini AI
   - Atualiza produto em tempo real
4. Atualiza estatísticas do projeto

**Chamada:**
```javascript
await projectService.startProjectProcessing(projectId);
```

### google-image-search
**Propósito:** Buscar imagens via Google Custom Search

**Chamada:**
```javascript
await imageSearchService.searchImages(query, numResults);
```

### validate-image-gemini
**Propósito:** Validar se imagem corresponde ao produto

**Chamada:**
```javascript
await imageValidationService.validateImage(
  imageUrl, 
  productName, 
  productDescription
);
```

## 📊 Estrutura do Banco de Dados

### Tabela: projects
```sql
- id (uuid, PK)
- user_id (uuid, FK -> profiles)
- name (text)
- description (text)
- status (enum: draft, processing, completed, failed)
- total_products (integer)
- products_completed (integer)
- products_from_bank (integer)
- products_from_web (integer)
- products_failed (integer)
- processing_started_at (timestamptz)
- processing_finished_at (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Tabela: products
```sql
- id (uuid, PK)
- project_id (uuid, FK -> projects)
- name (text)
- description (text)
- price (numeric)
- status (enum: pending, searching_bank, searching_web, validating, completed, failed)
- image_url (text)
- image_source (enum: certified_bank, web_validated, none)
- error_message (text)
- order (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### Tabela: certified_images
```sql
- id (uuid, PK)
- product_name (text)
- normalized_name (text) -- Para busca eficiente
- image_url (text)
- category (text)
- tags (text[])
- description (text)
- usage_count (integer)
- last_used_at (timestamptz)
- uploaded_by (uuid, FK -> profiles)
- created_at (timestamptz)
```

### Tabela: profiles
```sql
- id (uuid, PK, FK -> auth.users)
- email (text)
- full_name (text)
- role (enum: admin, operator)
- created_at (timestamptz)
- updated_at (timestamptz)
```

## 🎯 Status dos Produtos

### Fluxo de Status
```
pending
   ↓
searching_bank (buscando no banco certificado)
   ↓
searching_web (buscando na web)
   ↓
validating (validando com IA)
   ↓
completed ✅ ou failed ❌
```

### Códigos de Cor
- `pending` - Cinza
- `searching_bank` - Azul
- `searching_web` - Roxo
- `validating` - Amarelo
- `completed` - Verde
- `failed` - Vermelho

## 🔍 Normalização de Nomes

Para melhorar a correspondência entre produtos e imagens certificadas, todos os nomes são normalizados:
```javascript
function normalizeString(str) {
  return str
    .toLowerCase()                    // "COCA-COLA" -> "coca-cola"
    .normalize("NFD")                 // Remove acentos
    .replace(/[\u0300-\u036f]/g, "") // "café" -> "cafe"
    .replace(/[^a-z0-9\s]/g, "")     // Remove caracteres especiais
    .trim();                          // Remove espaços extras
}
```

**Exemplo:**
- Original: `"COCA-COLA 2L PET"`
- Normalizado: `"coca cola 2l pet"`

## ⚡ Performance

### Otimizações Implementadas

1. **React Query** - Cache automático de requisições
2. **Índices no BD** - Queries rápidas em tabelas grandes
3. **Realtime Seletivo** - Apenas componentes necessários subscrevem
4. **Lazy Loading** - Componentes carregados sob demanda
5. **Image Optimization** - Thumbnails quando disponível

### Índices Criados
```sql
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_project_status ON products(project_id, status);
CREATE INDEX idx_certified_images_normalized_name ON certified_images(normalized_name);
CREATE INDEX idx_projects_status ON projects(status);
```

## 🐛 Tratamento de Erros

### Frontend
- Mensagens de erro amigáveis
- Estados de loading
- Fallbacks para imagens quebradas
- Confirmações antes de ações destrutivas

### Backend (Edge Functions)
- Try-catch em todas as operações
- Logs detalhados no console
- Rollback em caso de falha
- Mensagens de erro estruturadas

### Exemplo de Tratamento
```javascript
try {
  await processProduct(product);
} catch (error) {
  await supabase
    .from('products')
    .update({
      status: 'failed',
      error_message: error.message
    })
    .eq('id', product.id);
}
```

## 🧪 Testando o Sistema

### 1. Criar Projeto de Teste
```javascript
// Lista de produtos de exemplo
const testProducts = [
  { name: "Coca-Cola 2L", price: "R$ 8,99" },
  { name: "Arroz Tio João 5kg", price: "R$ 22,50" },
  { name: "Feijão Preto 1kg", price: "R$ 6,99" }
];
```

### 2. Adicionar Imagem Certificada
1. Vá para "Biblioteca de Imagens"
2. Adicione uma imagem do "Coca-Cola 2L"
3. Processo priorizará essa imagem

### 3. Processar Projeto
1. Abra o projeto
2. Clique em "Iniciar Busca de Imagens"
3. Observe:
   - Coca-Cola será encontrada no banco (verde)
   - Outros produtos buscarão na web (azul)
   - Status atualiza em tempo real

## 📈 Monitoramento

### Logs do Supabase
```bash
# Ver logs das Edge Functions
supabase functions logs process-project

# Ver logs em tempo real
supabase functions logs --tail
```

### Métricas Importantes
- Taxa de sucesso de processamento
- Tempo médio por produto
- Uso do banco vs web
- Taxa de validação do Gemini

## 🔄 Atualizações Futuras Sugeridas

### Funcionalidades
- [ ] Exportar encarte como PDF
- [ ] Templates de encarte personalizados
- [ ] Histórico de versões de projetos
- [ ] Agendamento de processamento
- [ ] Notificações por email
- [ ] Integração com impressoras

### Melhorias Técnicas
- [ ] Testes automatizados (Jest/Vitest)
- [ ] CI/CD com GitHub Actions
- [ ] Compressão automática de imagens
- [ ] Cache de imagens validadas
- [ ] Rate limiting nas Edge Functions
- [ ] Logs estruturados com Winston

### UI/UX
- [ ] Modo escuro
- [ ] Arrastar e soltar produtos
- [ ] Visualização de encarte em tempo real
- [ ] Comparação de imagens lado a lado
- [ ] Atalhos de teclado

## 🤝 Contribuindo

### Setup de Desenvolvimento
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/auto-encarte-pro.git

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env

# Inicie o servidor de desenvolvimento
npm run dev
```

### Padrões de Código
- ESLint para linting
- Prettier para formatação
- Conventional Commits para mensagens

### Estrutura de Commits
```
feat: adiciona funcionalidade X
fix: corrige bug Y
docs: atualiza documentação
style: ajusta formatação
refactor: refatora componente Z
test: adiciona testes
chore: atualiza dependências
```

## 📞 Suporte

### Problemas Comuns

**1. Edge Function falha ao processar**
- Verifique se todas as variáveis de ambiente estão configuradas
- Confirme que as APIs do Google estão habilitadas
- Veja os logs: `supabase functions logs process-project`

**2. Imagens não aparecem**
- Verifique se o bucket `certified-images` existe
- Confirme as políticas de acesso
- Teste a URL pública da imagem

**3. Realtime não atualiza**
- Verifique se o Realtime está habilitado no projeto Supabase
- Confirme que há subscriptions ativas no console
- Recarregue a página para reconectar

**4. Upload de imagem falha**
- Verifique tamanho do arquivo (máximo 50MB padrão)
- Confirme tipo MIME permitido
- Teste permissões do bucket

## 📝 Licença

Este projeto é propriedade privada. Todos os direitos reservados.

## 👨‍💻 Autor

Desenvolvido por [Seu Nome]

---

## 🎉 Projeto Completo!

Este sistema agora está totalmente funcional com:
- ✅ Automação completa de busca e validação de imagens
- ✅ Upload real para Supabase Storage
- ✅ Interface moderna e responsiva
- ✅ Feedback em tempo real com Realtime
- ✅ Gestão completa de projetos e imagens
- ✅ Sistema de permissões robusto

**Próximos passos sugeridos:**
1. Deploy em produção (Vercel/Netlify)
2. Configurar domínio customizado
3. Adicionar analytics
4. Implementar backups automáticos
5. Criar documentação de usuário