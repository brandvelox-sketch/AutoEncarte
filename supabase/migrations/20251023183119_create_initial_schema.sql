/*
  # Schema Inicial - Auto Encarte Pro

  1. Tabelas Criadas
    - `profiles`
      - `id` (uuid, chave primária, referência a auth.users)
      - `email` (text)
      - `full_name` (text)
      - `role` (text, valores: 'admin', 'operator')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `projects`
      - `id` (uuid, chave primária)
      - `user_id` (uuid, referência a profiles)
      - `name` (text)
      - `description` (text)
      - `status` (text, valores: 'draft', 'in_progress', 'completed')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `products`
      - `id` (uuid, chave primária)
      - `project_id` (uuid, referência a projects)
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `image_validated` (boolean)
      - `validation_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `certified_images`
      - `id` (uuid, chave primária)
      - `google_drive_file_id` (text)
      - `filename` (text)
      - `url` (text)
      - `thumbnail_url` (text)
      - `category` (text)
      - `tags` (text[])
      - `validated` (boolean)
      - `validation_date` (timestamptz)
      - `uploaded_by` (uuid, referência a profiles)
      - `created_at` (timestamptz)

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas criadas para acesso baseado em autenticação e propriedade
    - Administradores têm acesso completo
    - Operadores têm acesso aos seus próprios dados

  3. Notas Importantes
    - Sistema de permissões baseado em roles (admin/operator)
    - Integração preparada para Google Drive (armazenamento de IDs)
    - Suporte a tags e categorização de imagens
    - Campos de validação para produtos e imagens certificadas
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) DEFAULT 0,
  image_url text DEFAULT '',
  image_validated boolean DEFAULT false,
  validation_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products from own projects"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = products.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products in own projects"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in own projects"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = products.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from own projects"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = products.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS certified_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_drive_file_id text UNIQUE NOT NULL,
  filename text NOT NULL,
  url text NOT NULL,
  thumbnail_url text DEFAULT '',
  category text DEFAULT '',
  tags text[] DEFAULT '{}',
  validated boolean DEFAULT false,
  validation_date timestamptz,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certified_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view certified images"
  ON certified_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert certified images"
  ON certified_images FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own certified images"
  ON certified_images FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Admins can update all certified images"
  ON certified_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete own certified images"
  ON certified_images FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can delete all certified images"
  ON certified_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_products_project_id ON products(project_id);
CREATE INDEX IF NOT EXISTS idx_certified_images_uploaded_by ON certified_images(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_certified_images_category ON certified_images(category);
