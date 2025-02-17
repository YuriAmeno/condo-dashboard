/*
  # Create Doormen Schema

  1. New Types
    - doorman_status: Enum for doorman status (active, vacation, away, inactive)
    - doorman_shift: Enum for work shifts (morning, afternoon, night)

  2. New Tables
    - doormen: Main table for doorman records
    - doormen_history: Track status changes and history

  3. Security
    - Enable RLS on all tables
    - Add policies for public access (temporary for development)

  4. Indexes
    - Add performance optimization indexes
*/

-- Create types with safe checks
DO $$ BEGIN
  CREATE TYPE doorman_status AS ENUM (
    'active',
    'vacation',
    'away',
    'inactive'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE doorman_shift AS ENUM (
    'morning',
    'afternoon',
    'night'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create doormen table
CREATE TABLE IF NOT EXISTS doormen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE SET NULL,
  name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  status doorman_status DEFAULT 'active',
  shift doorman_shift NOT NULL,
  photo_url text,
  documents jsonb DEFAULT '{}',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create history table
CREATE TABLE IF NOT EXISTS doormen_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doorman_id uuid REFERENCES doormen ON DELETE CASCADE,
  status doorman_status NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  reason text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE doormen ENABLE ROW LEVEL SECURITY;
ALTER TABLE doormen_history ENABLE ROW LEVEL SECURITY;

-- Create access policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Enable public read access to doormen" ON doormen;
  DROP POLICY IF EXISTS "Enable public insert access to doormen" ON doormen;
  DROP POLICY IF EXISTS "Enable public update access to doormen" ON doormen;
  DROP POLICY IF EXISTS "Enable public read access to doormen_history" ON doormen_history;
  DROP POLICY IF EXISTS "Enable public insert access to doormen_history" ON doormen_history;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Enable public read access to doormen"
  ON doormen FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to doormen"
  ON doormen FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to doormen"
  ON doormen FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable public read access to doormen_history"
  ON doormen_history FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to doormen_history"
  ON doormen_history FOR INSERT
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_doormen_user_id ON doormen(user_id);
CREATE INDEX IF NOT EXISTS idx_doormen_cpf ON doormen(cpf);
CREATE INDEX IF NOT EXISTS idx_doormen_email ON doormen(email);
CREATE INDEX IF NOT EXISTS idx_doormen_status ON doormen(status);
CREATE INDEX IF NOT EXISTS idx_doormen_shift ON doormen(shift);
CREATE INDEX IF NOT EXISTS idx_doormen_history_doorman_id ON doormen_history(doorman_id);
CREATE INDEX IF NOT EXISTS idx_doormen_history_status ON doormen_history(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_doormen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_doormen_updated_at ON doormen;
CREATE TRIGGER update_doormen_updated_at
  BEFORE UPDATE ON doormen
  FOR EACH ROW
  EXECUTE FUNCTION update_doormen_updated_at();

-- Add doorman_id to packages table
ALTER TABLE packages 
  ADD COLUMN IF NOT EXISTS doorman_id uuid REFERENCES doormen(id) ON DELETE SET NULL;

-- Create index for packages-doorman relationship
CREATE INDEX IF NOT EXISTS idx_packages_doorman_id ON packages(doorman_id);
CREATE INDEX IF NOT EXISTS idx_packages_doorman_status ON packages(doorman_id, status);
CREATE INDEX IF NOT EXISTS idx_packages_doorman_dates ON packages(doorman_id, received_at, delivered_at);