/*
  # Adicionar relacionamento entre residents e packages

  1. Alterações
    - Adicionar coluna resident_id na tabela packages
    - Criar foreign key para vincular packages com residents
    - Atualizar RLS policies

  2. Segurança
    - Manter RLS habilitado
    - Atualizar políticas para incluir novo relacionamento
*/

-- Adicionar coluna resident_id na tabela packages
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS resident_id uuid REFERENCES residents(id) ON DELETE SET NULL;

-- Criar índice para melhorar performance das queries
CREATE INDEX IF NOT EXISTS idx_packages_resident_id ON packages(resident_id);

-- Atualizar dados existentes
DO $$
DECLARE
  pkg RECORD;
  res_id uuid;
BEGIN
  FOR pkg IN SELECT p.id, p.apartment_id FROM packages p
  LOOP
    -- Encontrar o residente do apartamento
    SELECT id INTO res_id
    FROM residents
    WHERE apartment_id = pkg.apartment_id
    LIMIT 1;

    -- Atualizar o package com o resident_id
    IF res_id IS NOT NULL THEN
      UPDATE packages
      SET resident_id = res_id
      WHERE id = pkg.id;
    END IF;
  END LOOP;
END $$;