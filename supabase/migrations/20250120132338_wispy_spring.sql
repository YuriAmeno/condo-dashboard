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