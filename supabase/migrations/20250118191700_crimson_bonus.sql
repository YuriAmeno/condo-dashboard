-- Remover políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Enable insert for registration" ON auth.users;
DROP POLICY IF EXISTS "Users can view own data" ON auth.users;
DROP POLICY IF EXISTS "Users can update own data" ON auth.users;

-- Desabilitar RLS temporariamente para permitir operações iniciais
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Garantir que as colunas necessárias existam
ALTER TABLE auth.users 
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS last_login;

ALTER TABLE auth.users 
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'doorman',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

-- Garantir que o schema auth seja totalmente acessível para operações de autenticação
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA auth TO postgres, service_role;

-- Garantir que anon possa se registrar
GRANT USAGE ON SCHEMA auth TO anon;
GRANT SELECT, INSERT ON auth.users TO anon;

-- Garantir que authenticated possa atualizar seus dados
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO authenticated;

-- Atualizar função de manipulação de novos usuários
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que os metadados sejam sempre definidos
  NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', COALESCE(NEW.role, 'doorman'),
    'is_active', COALESCE(NEW.is_active, true)
  );
  
  -- Garantir que role e is_active sejam definidos
  NEW.role = COALESCE(NEW.role, 'doorman');
  NEW.is_active = COALESCE(NEW.is_active, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();

-- Garantir que a função seja acessível
GRANT EXECUTE ON FUNCTION auth.handle_new_user() TO postgres, service_role;