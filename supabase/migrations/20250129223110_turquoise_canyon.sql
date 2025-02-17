-- Limpar dados existentes que não pertencem a nenhum manager
DELETE FROM packages;
DELETE FROM residents;
DELETE FROM apartments;
DELETE FROM buildings;
DELETE FROM doormen;

-- Atualizar manager_id nas buildings existentes
UPDATE buildings b
SET manager_id = (
  SELECT m.id 
  FROM managers m 
  WHERE m.user_id = auth.uid()
)
WHERE b.manager_id IS NULL;

-- Atualizar manager_id nos doormen existentes
UPDATE doormen d
SET manager_id = (
  SELECT m.id 
  FROM managers m 
  WHERE m.user_id = auth.uid()
)
WHERE d.manager_id IS NULL;

-- Adicionar restrição NOT NULL após atualização
ALTER TABLE buildings 
  ALTER COLUMN manager_id SET NOT NULL;

ALTER TABLE doormen 
  ALTER COLUMN manager_id SET NOT NULL;