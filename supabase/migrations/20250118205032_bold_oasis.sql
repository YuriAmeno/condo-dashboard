-- Criar função para atualizar último login
CREATE OR REPLACE FUNCTION update_user_last_login(user_id uuid, login_timestamp timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('last_login', login_timestamp)
  WHERE id = user_id;
END;
$$;

-- Garantir que a função seja acessível
GRANT EXECUTE ON FUNCTION update_user_last_login TO authenticated;