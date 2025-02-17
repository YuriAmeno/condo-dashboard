-- Remover restrição NOT NULL temporariamente
ALTER TABLE doormen 
  ALTER COLUMN manager_id DROP NOT NULL;

-- Atualizar doormen existentes
UPDATE doormen d
SET manager_id = (
  SELECT m.id
  FROM managers m
  WHERE m.user_id = (
    SELECT user_id 
    FROM auth.users 
    WHERE raw_user_meta_data->>'role' = 'manager'
    LIMIT 1
  )
)
WHERE d.manager_id IS NULL;

-- Criar função para vincular doorman ao manager atual
CREATE OR REPLACE FUNCTION link_doorman_to_manager()
RETURNS TRIGGER AS $$
DECLARE
  v_manager_id uuid;
BEGIN
  -- Obter o manager_id do usuário atual
  SELECT id INTO v_manager_id
  FROM managers
  WHERE user_id = auth.uid();

  IF v_manager_id IS NULL THEN
    RAISE EXCEPTION 'Manager não encontrado';
  END IF;

  -- Atualizar o manager_id do doorman
  NEW.manager_id = v_manager_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para vincular doormen
DROP TRIGGER IF EXISTS tr_link_doorman_to_manager ON doormen;
CREATE TRIGGER tr_link_doorman_to_manager
  BEFORE INSERT ON doormen
  FOR EACH ROW
  EXECUTE FUNCTION link_doorman_to_manager();

-- Remover políticas existentes
DROP POLICY IF EXISTS "manager_full_access" ON doormen;
DROP POLICY IF EXISTS "doorman_read_own_data" ON doormen;

-- Criar novas políticas mais simples
CREATE POLICY "enable_read_doormen"
  ON doormen
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN auth.get_role() = 'manager' THEN
        EXISTS (
          SELECT 1 FROM managers m
          WHERE m.user_id = auth.uid()
          AND m.id = doormen.manager_id
        )
      WHEN auth.get_role() = 'doorman' THEN
        user_id = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "enable_write_doormen"
  ON doormen
  FOR ALL
  TO authenticated
  USING (auth.get_role() = 'manager')
  WITH CHECK (auth.get_role() = 'manager');

-- Adicionar restrição NOT NULL novamente após dados serem atualizados
ALTER TABLE doormen 
  ALTER COLUMN manager_id SET NOT NULL;