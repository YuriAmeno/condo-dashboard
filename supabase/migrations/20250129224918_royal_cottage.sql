-- Remover política existente
DROP POLICY IF EXISTS "manager_full_access" ON residents;

-- Criar nova política mais permissiva para leitura
CREATE POLICY "enable_read_residents"
  ON residents
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'manager' THEN
        EXISTS (
          SELECT 1 FROM apartments a
          JOIN buildings b ON b.id = a.building_id
          JOIN managers m ON m.id = b.manager_id
          WHERE a.id = residents.apartment_id
          AND m.user_id = auth.uid()
        )
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

-- Política para escrita (apenas managers)
CREATE POLICY "enable_write_residents"
  ON residents
  FOR ALL
  TO authenticated
  USING (
    auth.get_role() = 'manager' AND
    EXISTS (
      SELECT 1 FROM apartments a
      JOIN buildings b ON b.id = a.building_id
      JOIN managers m ON m.id = b.manager_id
      WHERE a.id = residents.apartment_id
      AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.get_role() = 'manager'
  );