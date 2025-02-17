/*
  # Add missing columns to packages table

  1. Changes
    - Add notes column for additional package information
    - Add storage_location column for package storage tracking
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS storage_location text;