-- Atualizar política de residents para permitir inserção em lote
DROP POLICY IF EXISTS "manager_full_access" ON residents;
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
    AND (
      -- Permitir inserção direta quando o apartment_id pertence ao manager
      EXISTS (
        SELECT 1 FROM apartments a
        JOIN buildings b ON b.id = a.building_id
        WHERE a.id = residents.apartment_id
        AND b.manager_id = get_manager_id()
      )
      OR
      -- Permitir inserção durante importação quando o apartment ainda não existe
      NOT EXISTS (
        SELECT 1 FROM residents r
        WHERE r.id = residents.id
      )
    )
  );

-- Atualizar política de apartments para permitir inserção em lote
DROP POLICY IF EXISTS "manager_full_access" ON apartments;
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
    AND (
      -- Permitir inserção direta quando o building pertence ao manager
      EXISTS (
        SELECT 1 FROM buildings b
        WHERE b.id = apartments.building_id
        AND b.manager_id = get_manager_id()
      )
      OR
      -- Permitir inserção durante importação quando o apartment ainda não existe
      NOT EXISTS (
        SELECT 1 FROM apartments a
        WHERE a.id = apartments.id
      )
    )
  );

-- Função para validar se um building pertence ao manager atual
CREATE OR REPLACE FUNCTION validate_building_access(building_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM buildings b
    WHERE b.id = building_id
    AND b.manager_id = get_manager_id()
  );
END;
$$;

-- Função para validar se um apartment pertence ao manager atual
CREATE OR REPLACE FUNCTION validate_apartment_access(apartment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM apartments a
    JOIN buildings b ON b.id = a.building_id
    WHERE a.id = apartment_id
    AND b.manager_id = get_manager_id()
  );
END;
$$;