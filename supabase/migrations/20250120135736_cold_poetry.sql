-- Remover políticas existentes
DROP POLICY IF EXISTS "enable_read_access_residents" ON residents;
DROP POLICY IF EXISTS "enable_manager_write_access_residents" ON residents;
DROP POLICY IF EXISTS "managers_full_access_residents" ON residents;
DROP POLICY IF EXISTS "doormen_read_residents" ON residents;

-- Criar novas políticas mais permissivas para leitura
CREATE POLICY "allow_read_access_residents"
  ON residents FOR SELECT
  TO authenticated
  USING (true);

-- Manter restrição de escrita apenas para managers
CREATE POLICY "allow_manager_write_access_residents"
  ON residents 
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.user_role() = 'manager');

CREATE POLICY "allow_manager_update_residents"
  ON residents 
  FOR UPDATE
  TO authenticated
  USING (auth.user_role() = 'manager')
  WITH CHECK (auth.user_role() = 'manager');

CREATE POLICY "allow_manager_delete_residents"
  ON residents 
  FOR DELETE
  TO authenticated
  USING (auth.user_role() = 'manager');

-- Garantir que RLS está habilitado
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Garantir que a função auth.user_role() existe
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'role'
     FROM auth.users
     WHERE id = auth.uid()),
    'doorman'
  );
$$;