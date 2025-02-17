import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';
import { formatPhoneForDB } from '@/lib/utils';

interface ImportConfig {
  type: 'residents' | 'apartments';
  mapping: Record<string, string>;
}

interface ExportConfig {
  type: 'residents' | 'apartments' | 'buildings';
  fields: string[];
  filters?: Record<string, any>;
}

interface ExcelRow {
  [key: string]: string | number | boolean | null;
}

export function useImportExport() {
  const { user } = useAuth();

  const importData = useMutation({
    mutationFn: async ({
      file,
      config,
    }: {
      file: File;
      config: ImportConfig;
    }) => {
      try {
        // Ler arquivo Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        if (!Array.isArray(rawData) || rawData.length === 0) {
          throw new Error('O arquivo não contém dados válidos');
        }

        if (config.type === 'residents') {
          // Get all buildings at once
          const { data: buildings, error: buildingsError } = await supabase
            .from('buildings')
            .select('id, name');

          if (buildingsError || !buildings) {
            throw new Error('Erro ao buscar prédios');
          }

          // Create building name -> id map
          const buildingsMap = new Map(
            buildings.map(b => [String(b.name).toLowerCase(), b.id])
          );

          let processedCount = 0;
          const errors: string[] = [];

          // Process each Excel row
          for (const row of rawData) {
            try {
              // Extract data using mapping
              const mappedName = Object.keys(row).find(key => config.mapping[key] === 'name');
              const mappedPhone = Object.keys(row).find(key => config.mapping[key] === 'phone');
              const mappedEmail = Object.keys(row).find(key => config.mapping[key] === 'email');
              const mappedBuilding = Object.keys(row).find(key => config.mapping[key] === 'building');
              const mappedApartment = Object.keys(row).find(key => config.mapping[key] === 'apartment');

              if (!mappedName || !mappedPhone || !mappedEmail || !mappedBuilding || !mappedApartment) {
                errors.push(`Linha ${processedCount + 1}: Mapeamento de colunas inválido`);
                continue;
              }

              const name = String(row[mappedName]).trim();
              const phone = String(row[mappedPhone]).trim();
              const email = String(row[mappedEmail]).trim();
              const building = String(row[mappedBuilding]).trim();
              const apartment = String(row[mappedApartment]).trim();

              // Basic validations
              if (!name || !phone || !email || !building || !apartment) {
                errors.push(`Linha ${processedCount + 1}: Dados incompletos`);
                continue;
              }

              // Get building ID
              const buildingId = buildingsMap.get(building.toLowerCase());
              if (!buildingId) {
                errors.push(`Linha ${processedCount + 1}: Prédio não encontrado: ${building}`);
                continue;
              }

              // Get or create apartment
              const { data: existingApartments, error: aptError } = await supabase
                .from('apartments')
                .select('id')
                .eq('building_id', buildingId)
                .eq('number', apartment)
                .limit(1);

              if (aptError) {
                errors.push(`Linha ${processedCount + 1}: Erro ao verificar apartamento`);
                continue;
              }

              let apartmentId: string;

              if (!existingApartments || existingApartments.length === 0) {
                // Create new apartment
                const { data: newApartment, error: createAptError } = await supabase
                  .from('apartments')
                  .insert({
                    building_id: buildingId,
                    number: apartment,
                  })
                  .select('id')
                  .single();

                if (createAptError || !newApartment) {
                  errors.push(`Linha ${processedCount + 1}: Erro ao criar apartamento`);
                  continue;
                }

                apartmentId = newApartment.id;
              } else {
                apartmentId = existingApartments[0].id;
              }

              // Check if resident with same email exists
              const { data: existingResident } = await supabase
                .from('residents')
                .select('id')
                .eq('email', email)
                .limit(1);

              if (existingResident && existingResident.length > 0) {
                errors.push(`Linha ${processedCount + 1}: Email já cadastrado: ${email}`);
                continue;
              }

              // Insert resident with user_id
              const { error: residentError } = await supabase
                .from('residents')
                .insert({
                  name,
                  phone: formatPhoneForDB(phone),
                  email,
                  apartment_id: apartmentId,
                  receive_notifications: true,
                  user_id: user?.id
                });

              if (residentError) {
                errors.push(`Linha ${processedCount + 1}: Erro ao inserir morador`);
                continue;
              }

              processedCount++;
            } catch (error) {
              errors.push(`Linha ${processedCount + 1}: Erro inesperado`);
              continue;
            }
          }

          if (errors.length > 0) {
            throw new Error(`Importação concluída com erros:\n${errors.join('\n')}`);
          }

          return processedCount;
        }

        throw new Error('Tipo de importação não suportado');
      } catch (error) {
        console.error('Erro na importação:', error);
        throw error;
      }
    },
  });

  const exportData = useMutation({
    mutationFn: async (config: ExportConfig) => {
      try {
        let exportData: any[] = [];

        if (config.type === 'residents') {
          const { data, error } = await supabase
            .from('residents')
            .select(`
              name,
              phone,
              email,
              apartment:apartments (
                number,
                building:buildings (
                  name
                )
              )
            `);

          if (error) throw error;

          exportData = data.map((resident: any) => ({
            Nome: resident.name,
            Telefone: resident.phone,
            Email: resident.email,
            Apartamento: resident.apartment?.number || '',
            Torre: resident.apartment?.building?.name || '',
          }));
        } else {
          const { data, error } = await supabase
            .from(config.type)
            .select(config.fields.join(','));

          if (error) throw error;
          exportData = data;
        }

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, config.type);

        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        return blob;
      } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
      }
    },
  });

  return {
    importData,
    exportData,
  };
}