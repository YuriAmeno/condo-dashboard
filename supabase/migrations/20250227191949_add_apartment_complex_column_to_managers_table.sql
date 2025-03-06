-- Adicionar coluna apartment_complex_id na tabela managers
ALTER TABLE managers
ADD COLUMN apartment_complex_id UUID REFERENCES apartment_complex(id);