/*
  # Adicionar módulo de gestão de porteiros

  1. Novos Tipos
    - doorman_status: Enum para status do porteiro
    - doorman_shift: Enum para turno de trabalho

  2. Novas Tabelas
    - doormen: Tabela principal de porteiros
    - doormen_history: Histórico de mudanças de status

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso público para leitura/escrita
*/

-- Criar tipos enum
CREATE TYPE doorman_status AS ENUM (
  'active',
  'vacation',
  'away',
  'inactive'
);

CREATE TYPE doorman_shift AS ENUM (
  'morning',
  'afternoon',
  'night'
);

-- Criar tabela de porteiros
CREATE TABLE IF NOT EXISTS doormen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status doorman_status DEFAULT 'active',
  shift doorman_shift NOT NULL,
  photo_url text,
  documents jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de histórico
CREATE TABLE IF NOT EXISTS doormen_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doorman_id uuid REFERENCES doormen ON DELETE CASCADE,
  status doorman_status NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  reason text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE doormen ENABLE ROW LEVEL SECURITY;
ALTER TABLE doormen_history ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Enable public read access to doormen"
  ON doormen FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to doormen"
  ON doormen FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to doormen"
  ON doormen FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public read access to doormen_history"
  ON doormen_history FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to doormen_history"
  ON doormen_history FOR INSERT
  WITH CHECK (true);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_doormen_user_id ON doormen(user_id);
CREATE INDEX IF NOT EXISTS idx_doormen_cpf ON doormen(cpf);
CREATE INDEX IF NOT EXISTS idx_doormen_email ON doormen(email);
CREATE INDEX IF NOT EXISTS idx_doormen_status ON doormen(status);
CREATE INDEX IF NOT EXISTS idx_doormen_shift ON doormen(shift);
CREATE INDEX IF NOT EXISTS idx_doormen_history_doorman_id ON doormen_history(doorman_id);
CREATE INDEX IF NOT EXISTS idx_doormen_history_status ON doormen_history(status);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_doormen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_doormen_updated_at
  BEFORE UPDATE ON doormen
  FOR EACH ROW
  EXECUTE FUNCTION update_doormen_updated_at();