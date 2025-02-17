-- Garantir que o schema auth seja totalmente acessível
GRANT USAGE ON SCHEMA auth TO postgres, service_role, anon, authenticated;

-- Garantir acesso à tabela users
GRANT ALL PRIVILEGES ON TABLE auth.users TO postgres, service_role;
GRANT SELECT, INSERT ON TABLE auth.users TO anon;
GRANT SELECT, UPDATE ON TABLE auth.users TO authenticated;

-- Garantir acesso às sequências
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA auth TO anon, authenticated;

-- Garantir que a função handle_new_user seja acessível
GRANT EXECUTE ON FUNCTION auth.handle_new_user() TO postgres, service_role;

-- Desabilitar RLS temporariamente para garantir o funcionamento inicial
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;