-- Remover políticas existentes
DROP POLICY IF EXISTS "allow_read_access_residents" ON residents;
DROP POLICY IF EXISTS "allow_manager_write_access_residents" ON residents;
DROP POLICY IF EXISTS "allow_manager_update_residents" ON residents;
DROP POLICY IF EXISTS "allow_manager_delete_residents" ON residents;

-- Criar novas políticas mais permissivas
CREATE POLICY "enable_full_access_for_manager"
  ON residents
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'manager')
  WITH CHECK (auth.user_role() = 'manager');

CREATE POLICY "enable_read_access_for_doorman"
  ON residents
  FOR SELECT
  TO authenticated
  USING (auth.user_role() = 'doorman');

-- Garantir que RLS está habilitado
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Atualizar políticas para apartments também (necessário para importação)
DROP POLICY IF EXISTS "enable_public_read_access" ON apartments;
DROP POLICY IF EXISTS "enable_manager_write_access" ON apartments;

CREATE POLICY "enable_full_access_for_manager"
  ON apartments
  FOR ALL
  TO authenticated
  USING (auth.user_role() = 'manager')
  WITH CHECK (auth.user_role() = 'manager');

CREATE POLICY "enable_read_access_for_doorman"
  ON apartments
  FOR SELECT
  TO authenticated
  USING (auth.user_role() = 'doorman');

-- Garantir que RLS está habilitado
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;