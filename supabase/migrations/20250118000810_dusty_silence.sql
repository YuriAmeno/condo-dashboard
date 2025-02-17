/*
  # Update package policies

  1. Changes
    - Update RLS policies for packages table to allow public access
    - Enable public read/write access for packages
  
  2. Security
    - Allow public access for demonstration purposes
    - In production, you would want to restrict this to authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read packages" ON packages;
DROP POLICY IF EXISTS "Allow authenticated users to insert packages" ON packages;
DROP POLICY IF EXISTS "Allow authenticated users to update packages" ON packages;

-- Create new public access policies
CREATE POLICY "Allow public read access to packages"
  ON packages FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to packages"
  ON packages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access to packages"
  ON packages FOR UPDATE
  USING (true)
  WITH CHECK (true);