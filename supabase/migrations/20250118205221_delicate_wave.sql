-- Remover função anterior se existir
DROP FUNCTION IF EXISTS update_user_last_login;

-- Criar nova função RPC para atualizar último login
CREATE OR REPLACE FUNCTION update_user_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _role text;
BEGIN
  -- Obter ID do usuário autenticado
  _user_id := auth.uid();
  
  -- Verificar se usuário está autenticado
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Obter role do usuário
  SELECT raw_user_meta_data->>'role'
  INTO _role
  FROM auth.users
  WHERE id = _user_id;
  
  -- Atualizar último login e metadados
  UPDATE auth.users
  SET 
    last_login = now(),
    raw_user_meta_data = raw_user_meta_data || jsonb_build_object(
      'last_login', now(),
      'role', COALESCE(_role, 'doorman'),
      'is_active', COALESCE((raw_user_meta_data->>'is_active')::boolean, true)
    )
  WHERE id = _user_id;
END;
$$;

-- Garantir que a função seja acessível
GRANT EXECUTE ON FUNCTION update_user_last_login TO authenticated;

-- Criar índice para melhorar performance das consultas de último login
CREATE INDEX IF NOT EXISTS idx_users_last_login ON auth.users(last_login);

-- Adicionar comentário explicativo na função
COMMENT ON FUNCTION update_user_last_login IS 
'Função RPC para atualizar o último login do usuário autenticado e garantir consistência dos metadados.';