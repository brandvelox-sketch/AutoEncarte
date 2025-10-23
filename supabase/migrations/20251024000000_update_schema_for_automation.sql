-- Adicionar novas colunas à tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_products INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS products_completed INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS products_from_bank INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS products_from_web INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS products_failed INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS processing_finished_at TIMESTAMPTZ;

-- Atualizar status do projeto para incluir novos valores
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('draft', 'processing', 'completed', 'failed'));

-- Adicionar novas colunas à tabela products
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'searching_bank', 'searching_web', 'validating', 'completed', 'failed'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_source TEXT 
  CHECK (image_source IN ('certified_bank', 'web_validated', 'none'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Adicionar novas colunas à tabela certified_images
ALTER TABLE certified_images ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE certified_images ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE certified_images ALTER COLUMN google_drive_file_id DROP NOT NULL;
ALTER TABLE certified_images DROP CONSTRAINT IF EXISTS certified_images_google_drive_file_id_key;
ALTER TABLE certified_images ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE certified_images ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE certified_images ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_project_status ON products(project_id, status);
CREATE INDEX IF NOT EXISTS idx_certified_images_normalized_name ON certified_images(normalized_name);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Atualizar dados existentes
UPDATE certified_images SET image_url = url WHERE image_url = '' AND url IS NOT NULL;
UPDATE products SET status = 'pending' WHERE status IS NULL;
UPDATE products SET "order" = 0 WHERE "order" IS NULL;