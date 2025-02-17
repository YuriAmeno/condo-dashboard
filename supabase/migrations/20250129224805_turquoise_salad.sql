-- Atualizar política de residents para usar user_id
DROP POLICY IF EXISTS "manager_full_access" ON residents;
CREATE POLICY "manager_full_access"
  ON residents
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'manager' THEN
        EXISTS (
          SELECT 1 FROM managers m
          WHERE m.user_id = auth.uid()
          AND m.id = (
            SELECT b.manager_id 
            FROM apartments a
            JOIN buildings b ON b.id = a.building_id
            WHERE a.id = residents.apartment_id
          )
        )
      ELSE false
    END
  )
  WITH CHECK (
    auth.get_role() = 'manager'
  );

-- Atualizar política de buildings para usar user_id
DROP POLICY IF EXISTS "manager_full_access" ON buildings;
CREATE POLICY "manager_full_access"
  ON buildings
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'manager' THEN
        EXISTS (
          SELECT 1 FROM managers m
          WHERE m.user_id = auth.uid()
          AND m.id = buildings.manager_id
        )
      ELSE false
    END
  )
  WITH CHECK (
    auth.get_role() = 'manager'
  );

-- Atualizar política de apartments para usar user_id
DROP POLICY IF EXISTS "manager_full_access" ON apartments;
CREATE POLICY "manager_full_access"
  ON apartments
  FOR ALL
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'manager' THEN
        EXISTS (
          SELECT 1 FROM managers m
          JOIN buildings b ON b.manager_id = m.id
          WHERE m.user_id = auth.uid()
          AND b.id = apartments.building_id
        )
      ELSE false
    END
  )
  WITH CHECK (
    auth.get_role() = 'manager'
  );

-- Função para obter manager_id do usuário atual
CREATE OR REPLACE FUNCTION get_current_manager_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_manager_id uuid;
BEGIN
  SELECT id INTO v_manager_id
  FROM managers
  WHERE user_id = auth.uid();
  
  RETURN v_manager_id;
END;
$$;