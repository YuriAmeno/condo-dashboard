-- Criar função para obter o ID do manager atual
CREATE OR REPLACE FUNCTION get_manager_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM managers WHERE user_id = auth.uid();
$$;

-- Adicionar coluna manager_id nas tabelas principais
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES managers(id) ON DELETE CASCADE;
ALTER TABLE doormen ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES managers(id) ON DELETE CASCADE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_buildings_manager_id ON buildings(manager_id);
CREATE INDEX IF NOT EXISTS idx_doormen_manager_id ON doormen(manager_id);

-- Atualizar políticas RLS para buildings
DROP POLICY IF EXISTS "enable_manager_access" ON buildings;
DROP POLICY IF EXISTS "enable_read_access" ON buildings;

CREATE POLICY "manager_full_access"
  ON buildings
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' 
    AND manager_id = get_manager_id()
  )
  WITH CHECK (
    auth.get_role() = 'manager'
    AND manager_id = get_manager_id()
  );

CREATE POLICY "doorman_read_access"
  ON buildings
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'doorman' THEN
        EXISTS (
          SELECT 1 FROM doormen d
          WHERE d.user_id = auth.uid()
          AND d.manager_id = buildings.manager_id
        )
      ELSE false
    END
  );

-- Atualizar políticas RLS para doormen
DROP POLICY IF EXISTS "enable_manager_access" ON doormen;
DROP POLICY IF EXISTS "enable_read_access" ON doormen;

CREATE POLICY "manager_full_access"
  ON doormen
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' 
    AND manager_id = get_manager_id()
  )
  WITH CHECK (
    auth.get_role() = 'manager'
    AND manager_id = get_manager_id()
  );

CREATE POLICY "doorman_read_own_data"
  ON doormen
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'doorman' THEN
        user_id = auth.uid()
      ELSE false
    END
  );

-- Atualizar políticas RLS para apartments
DROP POLICY IF EXISTS "enable_manager_access" ON apartments;
DROP POLICY IF EXISTS "enable_read_access" ON apartments;

CREATE POLICY "manager_full_access"
  ON apartments
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' 
    AND EXISTS (
      SELECT 1 FROM buildings b
      WHERE b.id = apartments.building_id
      AND b.manager_id = get_manager_id()
    )
  )
  WITH CHECK (
    auth.get_role() = 'manager'
    AND EXISTS (
      SELECT 1 FROM buildings b
      WHERE b.id = apartments.building_id
      AND b.manager_id = get_manager_id()
    )
  );

CREATE POLICY "doorman_read_access"
  ON apartments
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'doorman' THEN
        EXISTS (
          SELECT 1 FROM buildings b
          JOIN doormen d ON d.manager_id = b.manager_id
          WHERE b.id = apartments.building_id
          AND d.user_id = auth.uid()
        )
      ELSE false
    END
  );

-- Atualizar políticas RLS para residents
DROP POLICY IF EXISTS "enable_manager_access" ON residents;
DROP POLICY IF EXISTS "enable_read_access" ON residents;

CREATE POLICY "manager_full_access"
  ON residents
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' 
    AND EXISTS (
      SELECT 1 FROM apartments a
      JOIN buildings b ON b.id = a.building_id
      WHERE a.id = residents.apartment_id
      AND b.manager_id = get_manager_id()
    )
  )
  WITH CHECK (
    auth.get_role() = 'manager'
    AND EXISTS (
      SELECT 1 FROM apartments a
      JOIN buildings b ON b.id = a.building_id
      WHERE a.id = residents.apartment_id
      AND b.manager_id = get_manager_id()
    )
  );

CREATE POLICY "doorman_read_access"
  ON residents
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'doorman' THEN
        EXISTS (
          SELECT 1 FROM apartments a
          JOIN buildings b ON b.id = a.building_id
          JOIN doormen d ON d.manager_id = b.manager_id
          WHERE a.id = residents.apartment_id
          AND d.user_id = auth.uid()
        )
      ELSE false
    END
  );

-- Atualizar políticas RLS para packages
DROP POLICY IF EXISTS "enable_manager_access" ON packages;
DROP POLICY IF EXISTS "enable_read_access" ON packages;

CREATE POLICY "manager_full_access"
  ON packages
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' 
    AND EXISTS (
      SELECT 1 FROM apartments a
      JOIN buildings b ON b.id = a.building_id
      WHERE a.id = packages.apartment_id
      AND b.manager_id = get_manager_id()
    )
  )
  WITH CHECK (
    auth.get_role() = 'manager'
    AND EXISTS (
      SELECT 1 FROM apartments a
      JOIN buildings b ON b.id = a.building_id
      WHERE a.id = packages.apartment_id
      AND b.manager_id = get_manager_id()
    )
  );

CREATE POLICY "doorman_manage_packages"
  ON packages
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'doorman' THEN
        EXISTS (
          SELECT 1 FROM apartments a
          JOIN buildings b ON b.id = a.building_id
          JOIN doormen d ON d.manager_id = b.manager_id
          WHERE a.id = packages.apartment_id
          AND d.user_id = auth.uid()
        )
      ELSE false
    END
  )
  WITH CHECK (
    CASE 
      WHEN auth.get_role() = 'doorman' THEN
        EXISTS (
          SELECT 1 FROM apartments a
          JOIN buildings b ON b.id = a.building_id
          JOIN doormen d ON d.manager_id = b.manager_id
          WHERE a.id = packages.apartment_id
          AND d.user_id = auth.uid()
        )
      ELSE false
    END
  );

-- Trigger para automaticamente definir manager_id em novas buildings
CREATE OR REPLACE FUNCTION set_building_manager_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.manager_id = get_manager_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_building_manager_id ON buildings;
CREATE TRIGGER tr_building_manager_id
  BEFORE INSERT ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION set_building_manager_id();

-- Trigger para automaticamente definir manager_id em novos doormen
CREATE OR REPLACE FUNCTION set_doorman_manager_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.manager_id = get_manager_id();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_doorman_manager_id ON doormen;
CREATE TRIGGER tr_doorman_manager_id
  BEFORE INSERT ON doormen
  FOR EACH ROW
  EXECUTE FUNCTION set_doorman_manager_id();