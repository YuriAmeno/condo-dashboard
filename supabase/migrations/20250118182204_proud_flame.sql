-- Add role and status columns to auth.users
DO $$ BEGIN
  ALTER TABLE auth.users 
    ADD COLUMN IF NOT EXISTS role text DEFAULT 'doorman',
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS last_login timestamptz;

  -- Add check constraint for role
  ALTER TABLE auth.users 
    ADD CONSTRAINT valid_role CHECK (role IN ('manager', 'doorman'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', COALESCE(NEW.role, 'doorman'),
    'is_active', COALESCE(NEW.is_active, true)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to update last login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET last_login = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for login tracking
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.sessions;
CREATE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();

-- Update existing tables to ensure auth user relationships
ALTER TABLE doormen
  DROP CONSTRAINT IF EXISTS fk_user,
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

ALTER TABLE managers
  DROP CONSTRAINT IF EXISTS fk_user,
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth.users(role);
CREATE INDEX IF NOT EXISTS idx_auth_users_is_active ON auth.users(is_active);
CREATE INDEX IF NOT EXISTS idx_auth_users_last_login ON auth.users(last_login);