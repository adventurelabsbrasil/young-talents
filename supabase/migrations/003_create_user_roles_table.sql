-- Criar tabela de roles de usuários no schema young_talents
CREATE TABLE IF NOT EXISTS young_talents.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  photo TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON young_talents.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_email ON young_talents.user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON young_talents.user_roles(role);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON young_talents.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION young_talents.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE young_talents.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ler seu próprio role
CREATE POLICY "Usuários podem ler seu próprio role"
  ON young_talents.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política: Admin pode ler todos os roles
CREATE POLICY "Admin pode ler todos os roles"
  ON young_talents.user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM young_talents.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Política: Apenas admin pode inserir roles
CREATE POLICY "Apenas admin pode inserir roles"
  ON young_talents.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM young_talents.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Política: Apenas admin pode atualizar roles
CREATE POLICY "Apenas admin pode atualizar roles"
  ON young_talents.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM young_talents.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Política: Apenas admin pode deletar roles
CREATE POLICY "Apenas admin pode deletar roles"
  ON young_talents.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM young_talents.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
