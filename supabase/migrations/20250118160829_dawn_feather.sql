/*
  # Ajuste de políticas para a tabela residents

  1. Alterações
    - Remove políticas existentes
    - Adiciona novas políticas para permitir operações CRUD públicas
    - Mantém RLS habilitado para futura implementação de autenticação

  2. Políticas
    - Leitura: Permitida para todos
    - Inserção: Permitida para todos
    - Atualização: Permitida para todos
    - Deleção: Não permitida (por segurança)
*/

-- Remover políticas existentes
DROP POLICY IF EXISTS "Enable public read access to residents" ON residents;
DROP POLICY IF EXISTS "Enable public update access to residents notifications" ON residents;
DROP POLICY IF EXISTS "Allow authenticated users to read residents" ON residents;

-- Criar novas políticas
CREATE POLICY "Enable public read access to residents"
  ON residents FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to residents"
  ON residents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to residents"
  ON residents FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_residents_email ON residents(email);
CREATE INDEX IF NOT EXISTS idx_residents_apartment_id ON residents(apartment_id);