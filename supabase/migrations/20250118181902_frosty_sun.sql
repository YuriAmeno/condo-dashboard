-- Add role and status columns to auth.users safely
DO $$ BEGIN
  ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('manager', 'doorman'));
  ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
  ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS last_login timestamptz;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Drop existing policies safely
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable public read access to managers" ON managers;
  DROP POLICY IF EXISTS "Enable public insert access to managers" ON managers;
  DROP POLICY IF EXISTS "Enable managers to update their own data" ON managers;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Create managers table if not exists
CREATE TABLE IF NOT EXISTS managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text NOT NULL,
  building_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on managers
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "managers_read_policy"
  ON managers FOR SELECT
  USING (true);

CREATE POLICY "managers_insert_policy"
  ON managers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "managers_update_policy"
  ON managers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_managers_user_id ON managers(user_id);
CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'role', NEW.role,
    'is_active', true
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