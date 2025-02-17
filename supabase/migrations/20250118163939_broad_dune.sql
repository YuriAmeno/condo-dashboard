-- Adicionar coluna doorman_id na tabela packages
ALTER TABLE packages 
  ADD COLUMN IF NOT EXISTS doorman_id uuid REFERENCES doormen(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_packages_doorman_id ON packages(doorman_id);

-- Atualizar políticas existentes
DROP POLICY IF EXISTS "Enable public read access to packages" ON packages;
DROP POLICY IF EXISTS "Enable public insert access to packages" ON packages;
DROP POLICY IF EXISTS "Enable public update access to packages" ON packages;

-- Criar novas políticas
CREATE POLICY "Enable public read access to packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to packages"
  ON packages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to packages"
  ON packages FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Criar índices compostos para melhorar performance de queries comuns
CREATE INDEX IF NOT EXISTS idx_packages_doorman_status ON packages(doorman_id, status);
CREATE INDEX IF NOT EXISTS idx_packages_doorman_dates ON packages(doorman_id, received_at, delivered_at);