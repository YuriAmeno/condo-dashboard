-- Atualizar a função de manipulação de novos usuários
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário está se registrando pela primeira vez (não tem role definida)
  -- então é um síndico se registrando pela página de autenticação
  IF NEW.raw_user_meta_data->>'role' IS NULL THEN
    NEW.raw_user_meta_data = jsonb_build_object(
      'role', 'manager',
      'is_active', true
    );
    NEW.role = 'manager';
  ELSE
    -- Caso contrário, manter a role definida (para porteiros criados pelo módulo)
    NEW.raw_user_meta_data = COALESCE(NEW.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
      'role', COALESCE(NEW.raw_user_meta_data->>'role', 'doorman'),
      'is_active', COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true)
    );
    NEW.role = COALESCE(NEW.raw_user_meta_data->>'role', 'doorman');
  END IF;
  
  NEW.is_active = COALESCE((NEW.raw_user_meta_data->>'is_active')::boolean, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;