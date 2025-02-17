-- Adicionar user_id nas tabelas que precisam de relacionamento com auth.users
ALTER TABLE residents 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE buildings 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE apartments 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE packages 
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_residents_user_id ON residents(user_id);
CREATE INDEX IF NOT EXISTS idx_buildings_user_id ON buildings(user_id);
CREATE INDEX IF NOT EXISTS idx_apartments_user_id ON apartments(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_created_by_user_id ON packages(created_by_user_id);

-- Atualizar políticas RLS para usar o user_id
DROP POLICY IF EXISTS "allow_read_all" ON residents;
DROP POLICY IF EXISTS "allow_read_all" ON buildings;
DROP POLICY IF EXISTS "allow_read_all" ON apartments;
DROP POLICY IF EXISTS "allow_read_all" ON packages;

-- Criar novas políticas baseadas no user_id
CREATE POLICY "access_own_data" ON residents 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "access_own_data" ON buildings 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "access_own_data" ON apartments 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "access_own_data" ON packages 
  FOR ALL USING (auth.uid() = created_by_user_id);

-- Adicionar triggers para automaticamente preencher user_id
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.set_created_by_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by_user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para cada tabela
DROP TRIGGER IF EXISTS set_resident_user_id ON residents;
CREATE TRIGGER set_resident_user_id
  BEFORE INSERT ON residents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_building_user_id ON buildings;
CREATE TRIGGER set_building_user_id
  BEFORE INSERT ON buildings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_apartment_user_id ON apartments;
CREATE TRIGGER set_apartment_user_id
  BEFORE INSERT ON apartments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_package_created_by_user_id ON packages;
CREATE TRIGGER set_package_created_by_user_id
  BEFORE INSERT ON packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by_user_id();