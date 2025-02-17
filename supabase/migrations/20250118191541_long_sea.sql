-- Configurar permissões para auth.users
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários não autenticados possam se registrar
CREATE POLICY "Enable insert for registration"
  ON auth.users
  FOR INSERT
  WITH CHECK (true);

-- Permitir que usuários autenticados vejam seus próprios dados
CREATE POLICY "Users can view own data"
  ON auth.users
  FOR SELECT
  USING (auth.uid() = id);

-- Permitir que usuários autenticados atualizem seus próprios dados
CREATE POLICY "Users can update own data"
  ON auth.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Garantir que os campos role e is_active sejam definidos corretamente
ALTER TABLE auth.users 
  ALTER COLUMN role SET DEFAULT 'doorman',
  ALTER COLUMN is_active SET DEFAULT true;

-- Criar função para atualizar metadata do usuário
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raw_user_meta_data = jsonb_build_object(
    'role', COALESCE(NEW.role, 'doorman'),
    'is_active', COALESCE(NEW.is_active, true)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();

-- Garantir que o schema auth seja acessível
GRANT USAGE ON SCHEMA auth TO anon, authenticated;
GRANT SELECT ON auth.users TO anon, authenticated;
GRANT INSERT ON auth.users TO anon;
GRANT UPDATE ON auth.users TO authenticated;