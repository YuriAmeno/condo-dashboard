/*
  # Update RLS policies for public access

  1. Changes
    - Drop existing RLS policies for buildings and apartments
    - Create new policies allowing public access to buildings and apartments
  
  2. Security
    - Enable public read access to buildings and apartments
    - Maintain RLS enabled on tables
*/

-- Update buildings policies
DROP POLICY IF EXISTS "Allow authenticated users to read buildings" ON buildings;
CREATE POLICY "Allow public read access to buildings"
  ON buildings FOR SELECT
  USING (true);

-- Update apartments policies
DROP POLICY IF EXISTS "Allow authenticated users to read apartments" ON apartments;
CREATE POLICY "Allow public read access to apartments"
  ON apartments FOR SELECT
  USING (true);