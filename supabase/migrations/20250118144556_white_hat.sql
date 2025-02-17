/*
  # Sistema de Notificações

  1. Novas Tabelas
    - `notification_templates`
      - `id` (uuid, primary key)
      - `type` (enum)
      - `title` (text)
      - `content` (text)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `notification_queue`
      - `id` (uuid, primary key)
      - `resident_id` (uuid, foreign key)
      - `template_id` (uuid, foreign key)
      - `package_id` (uuid, foreign key, optional)
      - `status` (enum)
      - `scheduled_for` (timestamp)
      - `sent_at` (timestamp)
      - `delivered_at` (timestamp)
      - `read_at` (timestamp)
      - `error` (text)
      - `created_at` (timestamp)
    
    - `notification_logs`
      - `id` (uuid, primary key)
      - `queue_id` (uuid, foreign key)
      - `status` (enum)
      - `error` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamp)

  2. Alterações em Tabelas Existentes
    - Adiciona campos de controle de notificações na tabela `residents`

  3. Security
    - Enable RLS em todas as tabelas
    - Políticas de acesso público para leitura e escrita
*/

-- Criar tipos enum
CREATE TYPE notification_template_type AS ENUM (
  'package_arrival',
  'followup_24h',
  'followup_48h',
  'followup_72h',
  'followup_7d',
  'package_pickup'
);

CREATE TYPE notification_status AS ENUM (
  'pending',
  'sending',
  'sent',
  'delivered',
  'read',
  'failed'
);

-- Criar tabela de templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type notification_template_type NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de fila de notificações
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid REFERENCES residents(id) ON DELETE CASCADE,
  template_id uuid REFERENCES notification_templates(id) ON DELETE CASCADE,
  package_id uuid REFERENCES packages(id) ON DELETE SET NULL,
  status notification_status DEFAULT 'pending',
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  error text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES notification_queue(id) ON DELETE CASCADE,
  status notification_status NOT NULL,
  error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Adicionar campos de controle de notificações na tabela residents
ALTER TABLE residents 
  ADD COLUMN IF NOT EXISTS receive_notifications boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notifications_paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS notifications_paused_by text,
  ADD COLUMN IF NOT EXISTS notifications_resume_at timestamptz;

-- Habilitar RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY "Enable public read access to notification_templates"
  ON notification_templates FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to notification_templates"
  ON notification_templates FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to notification_templates"
  ON notification_templates FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public read access to notification_queue"
  ON notification_queue FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to notification_queue"
  ON notification_queue FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to notification_queue"
  ON notification_queue FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public read access to notification_logs"
  ON notification_logs FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to notification_logs"
  ON notification_logs FOR INSERT
  WITH CHECK (true);

-- Inserir templates padrão
INSERT INTO notification_templates (type, title, content, active) VALUES
  (
    'package_arrival',
    'Chegada de Encomenda',
    'Olá ${resident.name}! Uma encomenda da ${package.delivery_company} chegou para você. Por favor, retire na portaria em horário comercial.',
    true
  ),
  (
    'followup_24h',
    '1º Lembrete (24h)',
    'Olá ${resident.name}! Sua encomenda da ${package.store_name} está aguardando retirada há 24 horas.',
    true
  ),
  (
    'followup_48h',
    '2º Lembrete (48h)',
    'Olá ${resident.name}! Não esqueça de retirar sua encomenda da ${package.store_name}. Já se passaram 48 horas.',
    true
  ),
  (
    'followup_72h',
    '3º Lembrete (72h)',
    'Atenção ${resident.name}! Sua encomenda da ${package.store_name} está aguardando retirada há 3 dias.',
    true
  ),
  (
    'followup_7d',
    'Alerta Crítico (7 dias)',
    'URGENTE: ${resident.name}, sua encomenda da ${package.store_name} está há 7 dias aguardando retirada.',
    true
  ),
  (
    'package_pickup',
    'Confirmação de Retirada',
    'Obrigado ${resident.name}! Confirmamos a retirada da sua encomenda da ${package.store_name}.',
    true
  );