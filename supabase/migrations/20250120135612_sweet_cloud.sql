-- Remover políticas existentes
DROP POLICY IF EXISTS "managers_full_access_residents" ON residents;
DROP POLICY IF EXISTS "doormen_read_residents" ON residents;

-- Criar novas políticas
CREATE POLICY "enable_read_access_residents"
  ON residents FOR SELECT
  USING (true);

CREATE POLICY "enable_manager_write_access_residents"
  ON residents 
  FOR ALL 
  USING (auth.user_role() = 'manager')
  WITH CHECK (auth.user_role() = 'manager');

-- Garantir que RLS está habilitado
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;