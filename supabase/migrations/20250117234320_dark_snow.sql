/*
  # Initial Schema for Porta Dex

  1. New Tables
    - buildings: Stores condominium buildings information
    - apartments: Stores apartment information linked to buildings
    - residents: Stores resident information linked to apartments
    - packages: Stores package delivery information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read buildings"
  ON buildings FOR SELECT
  TO authenticated
  USING (true);

-- Create apartments table
CREATE TABLE IF NOT EXISTS apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  building_id uuid REFERENCES buildings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(building_id, number)
);

ALTER TABLE apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read apartments"
  ON apartments FOR SELECT
  TO authenticated
  USING (true);

-- Create residents table
CREATE TABLE IF NOT EXISTS residents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  phone text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read residents"
  ON residents FOR SELECT
  TO authenticated
  USING (true);

-- Create packages table with enum type
CREATE TYPE package_status AS ENUM ('pending', 'delivered');

CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code text UNIQUE NOT NULL,
  apartment_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  delivery_company text NOT NULL,
  store_name text NOT NULL,
  doorman_name text NOT NULL,
  received_at timestamptz DEFAULT now(),
  delivered_at timestamptz,
  status package_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read packages"
  ON packages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert packages"
  ON packages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update packages"
  ON packages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);