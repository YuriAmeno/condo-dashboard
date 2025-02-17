/*
  # Seed test data

  1. Test Data
    - Buildings: 3 buildings (Torre A, B, C)
    - Apartments: 4 apartments per building (101, 102, 201, 202)
    - Residents: 6 sample residents
    
  2. Security
    - Maintains existing RLS policies
    - Only adds sample data
*/

-- Insert test buildings
INSERT INTO buildings (id, name) VALUES
  ('b1f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1a', 'Torre A'),
  ('b2f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1b', 'Torre B'),
  ('b3f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1c', 'Torre C');

-- Insert test apartments
INSERT INTO apartments (id, number, building_id) VALUES
  -- Torre A
  ('a1f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1a', '101', 'b1f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1a'),
  ('a2f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1b', '102', 'b1f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1a'),
  ('a3f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1c', '201', 'b1f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1a'),
  ('a4f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1d', '202', 'b1f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1a'),
  -- Torre B
  ('a5f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1e', '101', 'b2f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1b'),
  ('a6f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1f', '102', 'b2f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1b'),
  ('a7f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d2d', '201', 'b2f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1b'),
  ('a8f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d2e', '202', 'b2f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1b'),
  -- Torre C
  ('a9f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d2f', '101', 'b3f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1c'),
  ('aa13c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d3a', '102', 'b3f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1c'),
  ('ab13c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d3b', '201', 'b3f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1c'),
  ('ac13c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d3c', '202', 'b3f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1c');

-- Insert test residents
INSERT INTO residents (name, apartment_id, phone, email) VALUES
  ('João Silva', 'a1f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1a', '(11) 99999-1111', 'joao.silva@example.com'),
  ('Maria Santos', 'a2f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1b', '(11) 99999-2222', 'maria.santos@example.com'),
  ('Pedro Oliveira', 'a5f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1e', '(11) 99999-3333', 'pedro.oliveira@example.com'),
  ('Ana Costa', 'a6f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d1f', '(11) 99999-4444', 'ana.costa@example.com'),
  ('Carlos Souza', 'a9f3c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d2f', '(11) 99999-5555', 'carlos.souza@example.com'),
  ('Lucia Ferreira', 'aa13c0e0-5c1a-4b4a-8b0a-7c1b3c0e0d3a', '(11) 99999-6666', 'lucia.ferreira@example.com');