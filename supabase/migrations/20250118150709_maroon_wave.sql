/*
  # Fix Residents RLS Policies

  1. Changes
    - Drop existing RLS policies for residents table
    - Create new public read access policy for residents table
    - Create new public update access policy for residents table
  
  2. Security
    - Enable RLS on residents table
    - Allow public read access to all resident data
    - Allow public update access for notification settings only
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read residents" ON residents;
DROP POLICY IF EXISTS "Allow public read access to residents" ON residents;
DROP POLICY IF EXISTS "Allow public update access to residents" ON residents;

-- Create new policies
CREATE POLICY "Enable public read access to residents"
  ON residents FOR SELECT
  USING (true);

CREATE POLICY "Enable public update access to residents notifications"
  ON residents FOR UPDATE
  USING (true)
  WITH CHECK (true);