-- Garantir que todas as tabelas tenham RLS habilitado
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE doormen ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DO $$ 
BEGIN
  -- Remover políticas da tabela buildings
  DROP POLICY IF EXISTS "Enable public read access to buildings" ON buildings;
  
  -- Remover políticas da tabela apartments
  DROP POLICY IF EXISTS "Enable public read access to apartments" ON apartments;
  
  -- Remover políticas da tabela residents
  DROP POLICY IF EXISTS "Enable public read access to residents" ON residents;
  
  -- Remover políticas da tabela packages
  DROP POLICY IF EXISTS "Enable public read access to packages" ON packages;
  DROP POLICY IF EXISTS "Enable public insert access to packages" ON packages;
  DROP POLICY IF EXISTS "Enable public update access to packages" ON packages;
  
  -- Remover políticas da tabela doormen
  DROP POLICY IF EXISTS "Enable public read access to doormen" ON doormen;
  
  -- Remover políticas da tabela managers
  DROP POLICY IF EXISTS "Enable public read access to managers" ON managers;
END $$;

-- Criar políticas básicas para usuários autenticados
CREATE POLICY "allow_read_all" ON buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_read_all" ON apartments FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_read_all" ON residents FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_read_all" ON packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_read_all" ON doormen FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_read_all" ON managers FOR SELECT TO authenticated USING (true);

-- Permitir inserção e atualização para usuários autenticados
CREATE POLICY "allow_insert" ON packages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_update" ON packages FOR UPDATE TO authenticated USING (true);

-- Garantir que doormen e managers possam ser vinculados a auth.users
CREATE POLICY "allow_insert" ON doormen FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_update" ON doormen FOR UPDATE TO authenticated USING (true);

CREATE POLICY "allow_insert" ON managers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_update" ON managers FOR UPDATE TO authenticated USING (true);

-- Adicionar índices para melhorar performance das queries de relacionamento
CREATE INDEX IF NOT EXISTS idx_doormen_user_id ON doormen(user_id);
CREATE INDEX IF NOT EXISTS idx_managers_user_id ON managers(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_doorman_id ON packages(doorman_id);