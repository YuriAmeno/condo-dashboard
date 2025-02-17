-- Atualizar política de buildings para permitir acesso durante importação
DROP POLICY IF EXISTS "manager_full_access" ON buildings;
CREATE POLICY "manager_full_access"
  ON buildings
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' 
    AND (
      manager_id = get_manager_id()
      OR
      -- Permitir acesso durante importação
      EXISTS (
        SELECT 1 FROM managers m
        WHERE m.user_id = auth.uid()
        AND m.id = get_manager_id()
      )
    )
  )
  WITH CHECK (
    auth.get_role() = 'manager'
    AND (
      manager_id = get_manager_id()
      OR manager_id IS NULL -- Permitir inserção sem manager_id durante importação
    )
  );

-- Atualizar política de apartments para melhorar suporte à importação
DROP POLICY IF EXISTS "manager_full_access" ON apartments;
CREATE POLICY "manager_full_access"
  ON apartments
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' 
    AND (
      EXISTS (
        SELECT 1 FROM buildings b
        WHERE b.id = apartments.building_id
        AND b.manager_id = get_manager_id()
      )
      OR
      -- Permitir acesso durante importação
      EXISTS (
        SELECT 1 FROM managers m
        WHERE m.user_id = auth.uid()
        AND m.id = get_manager_id()
      )
    )
  )
  WITH CHECK (
    auth.get_role() = 'manager'
  );

-- Atualizar política de residents para melhorar suporte à importação
DROP POLICY IF EXISTS "manager_full_access" ON residents;
CREATE POLICY "manager_full_access"
  ON residents
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager'
  )
  WITH CHECK (
    auth.get_role() = 'manager'
  );

-- Criar função para processar importação
CREATE OR REPLACE FUNCTION process_resident_import(
  p_name text,
  p_email text,
  p_phone text,
  p_building_name text,
  p_apartment_number text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_building_id uuid;
  v_apartment_id uuid;
  v_resident_id uuid;
  v_manager_id uuid;
BEGIN
  -- Obter manager_id
  SELECT id INTO v_manager_id
  FROM managers
  WHERE user_id = auth.uid();

  IF v_manager_id IS NULL THEN
    RAISE EXCEPTION 'Manager não encontrado';
  END IF;

  -- Buscar ou criar building
  SELECT id INTO v_building_id
  FROM buildings
  WHERE name = p_building_name
  AND manager_id = v_manager_id;

  IF v_building_id IS NULL THEN
    INSERT INTO buildings (name, manager_id)
    VALUES (p_building_name, v_manager_id)
    RETURNING id INTO v_building_id;
  END IF;

  -- Buscar ou criar apartment
  SELECT id INTO v_apartment_id
  FROM apartments
  WHERE building_id = v_building_id
  AND number = p_apartment_number;

  IF v_apartment_id IS NULL THEN
    INSERT INTO apartments (building_id, number)
    VALUES (v_building_id, p_apartment_number)
    RETURNING id INTO v_apartment_id;
  END IF;

  -- Criar resident
  INSERT INTO residents (name, email, phone, apartment_id)
  VALUES (p_name, p_email, p_phone, v_apartment_id)
  RETURNING id INTO v_resident_id;

  RETURN v_resident_id;
END;
$$;