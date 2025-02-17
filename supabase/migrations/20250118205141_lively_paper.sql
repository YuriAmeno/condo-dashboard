-- Remover políticas existentes
DO $$ 
BEGIN
  -- Buildings
  DROP POLICY IF EXISTS "allow_read_all" ON buildings;
  DROP POLICY IF EXISTS "access_own_data" ON buildings;
  
  -- Apartments
  DROP POLICY IF EXISTS "allow_read_all" ON apartments;
  DROP POLICY IF EXISTS "access_own_data" ON apartments;
  
  -- Residents
  DROP POLICY IF EXISTS "allow_read_all" ON residents;
  DROP POLICY IF EXISTS "access_own_data" ON residents;
  
  -- Packages
  DROP POLICY IF EXISTS "allow_read_all" ON packages;
  DROP POLICY IF EXISTS "access_own_data" ON packages;
  
  -- Doormen
  DROP POLICY IF EXISTS "allow_read_all" ON doormen;
  DROP POLICY IF EXISTS "access_own_data" ON doormen;
  
  -- Managers
  DROP POLICY IF EXISTS "allow_read_all" ON managers;
  DROP POLICY IF EXISTS "access_own_data" ON managers;
END $$;

-- Função auxiliar para verificar role do usuário
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

-- Função auxiliar para verificar se usuário é manager
CREATE OR REPLACE FUNCTION auth.is_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.user_role() = 'manager';
$$;

-- Políticas para Buildings
CREATE POLICY "managers_full_access_buildings" ON buildings
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_read_buildings" ON buildings
  FOR SELECT USING (NOT auth.is_manager());

-- Políticas para Apartments
CREATE POLICY "managers_full_access_apartments" ON apartments
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_read_apartments" ON apartments
  FOR SELECT USING (NOT auth.is_manager());

-- Políticas para Residents
CREATE POLICY "managers_full_access_residents" ON residents
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_read_residents" ON residents
  FOR SELECT USING (NOT auth.is_manager());

-- Políticas para Packages
CREATE POLICY "managers_full_access_packages" ON packages
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_manage_packages" ON packages
  FOR ALL USING (NOT auth.is_manager());

-- Políticas para Doormen
CREATE POLICY "managers_full_access_doormen" ON doormen
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_read_own_data" ON doormen
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para Managers
CREATE POLICY "managers_read_own_data" ON managers
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para Notification Templates
CREATE POLICY "managers_full_access_templates" ON notification_templates
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_read_templates" ON notification_templates
  FOR SELECT USING (NOT auth.is_manager());

-- Políticas para Notification Queue
CREATE POLICY "managers_full_access_queue" ON notification_queue
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_read_queue" ON notification_queue
  FOR SELECT USING (NOT auth.is_manager());

-- Políticas para Notification Logs
CREATE POLICY "managers_full_access_logs" ON notification_logs
  FOR ALL USING (auth.is_manager());

CREATE POLICY "doormen_read_logs" ON notification_logs
  FOR SELECT USING (NOT auth.is_manager());

-- Garantir que todas as tabelas tenham RLS habilitado
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doormen ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;