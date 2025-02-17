-- Remover função anterior se existir
DROP FUNCTION IF EXISTS update_user_last_login;

-- Criar nova função RPC para atualizar último login
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar último login do usuário autenticado
  UPDATE auth.users
  SET 
    last_login = now(),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object('last_login', now())
  WHERE id = auth.uid();
END;
$$;

-- Garantir que a função seja acessível
GRANT EXECUTE ON FUNCTION update_user_last_login TO authenticated;

-- Criar índice para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_last_login ON auth.users(last_login);