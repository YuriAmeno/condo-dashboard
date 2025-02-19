import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { PackageFormData } from "@/lib/validations/package";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";

type Package = Database["public"]["Tables"]["packages"]["Insert"] & {
  apartment: Database["public"]["Tables"]["apartments"]["Row"];
  building: Database["public"]["Tables"]["buildings"]["Row"];
};

export function useCreatePackage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userType = useUserType();
  return useMutation({
    mutationFn: async (data: PackageFormData) => {
      try {
        if (!user?.id) {
          throw new Error("Usuário não autenticado");
        }

        const userLogged = userType.data;

        let doormanId: string | null = null;
        let doormanName: string = "";

        // Se for porteiro, buscar informações do porteiro atual
        if (user.app_metadata.role === "doorman") {
          const { data: doormen, error: doormanError } = await supabase
            .from("doormen")
            .select("id, name")
            .eq("user_id", user.id)
            .single();

          if (doormanError) {
            console.error("Erro ao buscar porteiro:", doormanError);
            throw new Error("Erro ao buscar informações do porteiro");
          }

          doormanId = doormen.id;
          doormanName = doormen.name;
        }

        if (user.app_metadata.role === "manager") {
          const { data: manager, error: managerError } = await supabase
            .from("managers")
            .select("name")
            .eq("user_id", user.id)
            .single();

          if (managerError) {
            console.error("Erro ao buscar síndico:", managerError);
            throw new Error("Erro ao buscar informações do síndico");
          }

          doormanName = `${manager.name} (Síndico)`;
        }

        console.log(doormanId);

        console.log(userLogged);

        // Criar a encomenda
        const { data: package_, error } = await supabase
          .from("packages")
          .insert({
            qr_code: crypto.randomUUID(),
            apartment_id: data.apartment_id,
            resident_id: data.resident_id,
            delivery_company: data.delivery_company,
            store_name: data.store_name,
            doorman_id: userLogged?.doormenId ?? null,
            doorman_name: doormanName,
            notes: data.notes,
            storage_location: data.storage_location,
            received_at: new Date().toISOString(),
            status: "pending",
            created_by_user_id: user.id,
          })
          .select(
            `
            *,
            apartment:apartments (
              *,
              building:buildings (*)
            )
          `
          )
          .single();

        if (error) {
          console.error("Erro ao criar encomenda:", error);
          throw error;
        }

        if (!package_) {
          throw new Error("Erro ao criar encomenda");
        }

        // Reestrutura os dados para o formato esperado
        const formattedPackage = {
          ...package_,
          building: package_.apartment.building,
        };

        return formattedPackage as Package;
      } catch (error) {
        // Propagar erro para ser tratado pelo componente
        throw error instanceof Error
          ? error
          : new Error("Erro ao registrar encomenda");
      }
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      queryClient.invalidateQueries({ queryKey: ["recent-packages"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] });
    },
  });
}
