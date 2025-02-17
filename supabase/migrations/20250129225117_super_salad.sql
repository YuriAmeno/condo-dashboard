-- Remover políticas existentes
DROP POLICY IF EXISTS "enable_read_residents" ON residents;
DROP POLICY IF EXISTS "enable_write_residents" ON residents;
DROP POLICY IF EXISTS "manager_full_access" ON buildings;
DROP POLICY IF EXISTS "doorman_read_access" ON buildings;

-- Criar novas políticas mais simples
CREATE POLICY "enable_read_buildings"
  ON buildings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_write_buildings"
  ON buildings
  FOR ALL
  TO authenticated
  USING (auth.get_role() = 'manager')
  WITH CHECK (auth.get_role() = 'manager');

CREATE POLICY "enable_read_residents"
  ON residents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_write_residents"
  ON residents
  FOR ALL
  TO authenticated
  USING (auth.get_role() = 'manager')
  WITH CHECK (auth.get_role() = 'manager');

-- Garantir que RLS está habilitado
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Criar função para vincular residents ao manager atual
CREATE OR REPLACE FUNCTION link_resident_to_manager()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o user_id do resident para o manager atual
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para vincular residents
DROP TRIGGER IF EXISTS tr_link_resident_to_manager ON residents;
CREATE TRIGGER tr_link_resident_to_manager
  BEFORE INSERT ON residents
  FOR EACH ROW
  EXECUTE FUNCTION link_resident_to_manager();