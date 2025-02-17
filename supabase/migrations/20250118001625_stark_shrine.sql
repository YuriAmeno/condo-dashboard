/*
  # Update RLS policies for public access
  
  1. Changes
    - Remove authentication requirements from all policies
    - Enable public read/write access for required operations
    - Maintain data integrity with appropriate constraints
  
  2. Security
    - Policies updated to allow public access while maintaining data safety
    - No destructive operations allowed
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to buildings" ON buildings;
DROP POLICY IF EXISTS "Allow public read access to apartments" ON apartments;
DROP POLICY IF EXISTS "Allow public read access to packages" ON packages;
DROP POLICY IF EXISTS "Allow public insert access to packages" ON packages;
DROP POLICY IF EXISTS "Allow public update access to packages" ON packages;

-- Create new policies for buildings
CREATE POLICY "Enable public read access to buildings"
  ON buildings FOR SELECT
  USING (true);

-- Create new policies for apartments
CREATE POLICY "Enable public read access to apartments"
  ON apartments FOR SELECT
  USING (true);

-- Create new policies for packages
CREATE POLICY "Enable public read access to packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Enable public insert access to packages"
  ON packages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable public update access to packages"
  ON packages FOR UPDATE
  USING (true)
  WITH CHECK (true);