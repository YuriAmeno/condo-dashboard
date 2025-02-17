-- Remover políticas existentes
DROP POLICY IF EXISTS "enable_full_access_for_manager" ON residents;
DROP POLICY IF EXISTS "enable_read_access_for_doorman" ON residents;
DROP POLICY IF EXISTS "enable_full_access_for_manager" ON apartments;
DROP POLICY IF EXISTS "enable_read_access_for_doorman" ON apartments;
DROP POLICY IF EXISTS "enable_full_access_for_manager" ON buildings;
DROP POLICY IF EXISTS "enable_read_access_for_doorman" ON buildings;

-- Criar políticas mais permissivas para managers
CREATE POLICY "managers_full_access"
  ON residents
  FOR ALL
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'manager'
  )
  WITH CHECK (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'manager'
  );

CREATE POLICY "managers_full_access"
  ON apartments
  FOR ALL
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'manager'
  )
  WITH CHECK (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'manager'
  );

CREATE POLICY "managers_full_access"
  ON buildings
  FOR ALL
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'manager'
  )
  WITH CHECK (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'manager'
  );

-- Criar políticas de leitura para porteiros
CREATE POLICY "doormen_read_access"
  ON residents
  FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'doorman'
  );

CREATE POLICY "doormen_read_access"
  ON apartments
  FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'doorman'
  );

CREATE POLICY "doormen_read_access"
  ON buildings
  FOR SELECT
  TO authenticated
  USING (
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) = 'doorman'
  );

-- Garantir que RLS está habilitado
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;