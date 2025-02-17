-- Adicionar user_id nas tabelas de notificação
ALTER TABLE notification_templates 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE notification_queue 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE notification_logs 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_user_id ON notification_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);

-- Atualizar políticas RLS
DROP POLICY IF EXISTS "allow_read_all" ON notification_templates;
DROP POLICY IF EXISTS "allow_read_all" ON notification_queue;
DROP POLICY IF EXISTS "allow_read_all" ON notification_logs;

-- Criar novas políticas baseadas no user_id
CREATE POLICY "access_own_data" ON notification_templates 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "access_own_data" ON notification_queue 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "access_own_data" ON notification_logs 
  FOR ALL USING (auth.uid() = user_id);

-- Adicionar triggers para automaticamente preencher user_id
DROP TRIGGER IF EXISTS set_notification_template_user_id ON notification_templates;
CREATE TRIGGER set_notification_template_user_id
  BEFORE INSERT ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_notification_queue_user_id ON notification_queue;
CREATE TRIGGER set_notification_queue_user_id
  BEFORE INSERT ON notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_notification_logs_user_id ON notification_logs;
CREATE TRIGGER set_notification_logs_user_id
  BEFORE INSERT ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();