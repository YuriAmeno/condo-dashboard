import { z } from "zod";

export const packageSchema = z.object({
  building_id: z.string({
    required_error: "Selecione uma torre",
  }),
  apartment_id: z.string({
    required_error: "Selecione um apartamento",
  }),
  resident_id: z.string({
    required_error: "Selecione um morador",
  }),
  delivery_company: z.string().min(1, "Empresa de entrega é obrigatória"),
  custom_delivery_company: z.string().optional(),
  store_name: z.string().min(1, "Nome da loja é obrigatório"),
  custom_store_name: z.string().optional(),
  notes: z.string().optional(),
  storage_location: z.string().optional(),
});

export type PackageFormData = z.infer<typeof packageSchema>;
