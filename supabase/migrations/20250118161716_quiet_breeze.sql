/*
  # Corrigir políticas RLS para apartamentos

  1. Alterações
    - Remover políticas existentes
    - Adicionar novas políticas para permitir inserção e atualização
  
  2. Segurança
    - Permitir acesso público para operações CRUD em apartamentos
    - Manter rastreabilidade com timestamps
*/

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable public read access to apartments" ON apartments;

-- Criar novas políticas
CREATE POLICY "Enable public read access to apartments"
  ON apartments FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to apartments"
  ON apartments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to apartments"
  ON apartments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public delete access to apartments"
  ON apartments FOR DELETE
  USING (true);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_apartments_building_number ON apartments(building_id, number);
CREATE INDEX IF NOT EXISTS idx_apartments_number ON apartments(number);