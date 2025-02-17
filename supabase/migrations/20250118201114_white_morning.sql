-- Remover políticas existentes
DROP POLICY IF EXISTS "managers_read_own_data" ON managers;
DROP POLICY IF EXISTS "managers_insert_own_data" ON managers;
DROP POLICY IF EXISTS "managers_update_own_data" ON managers;
DROP POLICY IF EXISTS "doormen_read_own_data" ON doormen;
DROP POLICY IF EXISTS "doormen_insert_own_data" ON doormen;
DROP POLICY IF EXISTS "doormen_update_own_data" ON doormen;
DROP POLICY IF EXISTS "buildings_read_by_manager" ON buildings;
DROP POLICY IF EXISTS "buildings_insert_by_manager" ON buildings;
DROP POLICY IF EXISTS "buildings_update_by_manager" ON buildings;
DROP POLICY IF EXISTS "apartments_read_by_manager" ON apartments;
DROP POLICY IF EXISTS "apartments_insert_by_manager" ON apartments;
DROP POLICY IF EXISTS "apartments_update_by_manager" ON apartments;
DROP POLICY IF EXISTS "packages_read_by_user" ON packages;
DROP POLICY IF EXISTS "packages_insert_by_user" ON packages;
DROP POLICY IF EXISTS "packages_update_by_user" ON packages;

-- Habilitar RLS em todas as tabelas
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doormen ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Políticas simples para managers
CREATE POLICY "managers_access"
  ON managers FOR ALL
  USING (auth.uid() = user_id);

-- Políticas simples para doormen
CREATE POLICY "doormen_access"
  ON doormen FOR ALL
  USING (auth.uid() = user_id);

-- Políticas simples para buildings
CREATE POLICY "buildings_access"
  ON buildings FOR ALL
  USING (true);

-- Políticas simples para apartments
CREATE POLICY "apartments_access"
  ON apartments FOR ALL
  USING (true);

-- Políticas simples para packages
CREATE POLICY "packages_access"
  ON packages FOR ALL
  USING (true);