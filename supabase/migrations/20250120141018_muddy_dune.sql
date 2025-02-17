-- Limpar tabelas relacionadas primeiro
TRUNCATE TABLE notification_logs CASCADE;
TRUNCATE TABLE notification_queue CASCADE;
TRUNCATE TABLE notification_templates CASCADE;
TRUNCATE TABLE packages CASCADE;
TRUNCATE TABLE residents CASCADE;
TRUNCATE TABLE apartments CASCADE;
TRUNCATE TABLE buildings CASCADE;
TRUNCATE TABLE doormen_history CASCADE;
TRUNCATE TABLE doormen CASCADE;
TRUNCATE TABLE managers CASCADE;

-- Limpar usuários do auth
DELETE FROM auth.users;

-- Reinserir templates de notificação padrão
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