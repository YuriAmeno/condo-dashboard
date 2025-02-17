-- Remover políticas existentes
DROP POLICY IF EXISTS "managers_full_access" ON residents;
DROP POLICY IF EXISTS "doormen_read_access" ON residents;
DROP POLICY IF EXISTS "managers_full_access" ON apartments;
DROP POLICY IF EXISTS "doormen_read_access" ON apartments;
DROP POLICY IF EXISTS "managers_full_access" ON buildings;
DROP POLICY IF EXISTS "doormen_read_access" ON buildings;

-- Criar função auxiliar para verificar role
CREATE OR REPLACE FUNCTION auth.get_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    role,
    raw_user_meta_data->>'role',
    raw_app_meta_data->>'role',
    'doorman'
  )::text
  FROM auth.users
  WHERE id = auth.uid();
$$;

-- Criar políticas para managers
CREATE POLICY "enable_manager_access"
  ON residents
  FOR ALL
  TO authenticated
  USING (auth.get_role() = 'manager')
  WITH CHECK (auth.get_role() = 'manager');

CREATE POLICY "enable_manager_access"
  ON apartments
  FOR ALL
  TO authenticated
  USING (auth.get_role() = 'manager')
  WITH CHECK (auth.get_role() = 'manager');

CREATE POLICY "enable_manager_access"
  ON buildings
  FOR ALL
  TO authenticated
  USING (auth.get_role() = 'manager')
  WITH CHECK (auth.get_role() = 'manager');

-- Criar políticas de leitura para todos os usuários autenticados
CREATE POLICY "enable_read_access"
  ON residents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_read_access"
  ON apartments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_read_access"
  ON buildings
  FOR SELECT
  TO authenticated
  USING (true);

-- Garantir que RLS está habilitado
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- Atualizar metadados dos usuários existentes
UPDATE auth.users
SET 
  raw_app_meta_data = raw_user_meta_data,
  raw_user_meta_data = CASE 
    WHEN raw_user_meta_data->>'role' IS NULL THEN 
      jsonb_build_object('role', COALESCE(role, 'doorman'), 'is_active', true)
    ELSE raw_user_meta_data
  END;