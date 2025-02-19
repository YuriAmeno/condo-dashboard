import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export const useUserType = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_type", user?.id], // Mantém o cache por usuário específico
    queryFn: async (): Promise<{
      type: string;
      relatedId: string | null;
      doormanUserId?: string | null;
      doormenId?: string | null;
      managerId?: string | null;
    } | null> => {
      if (!user) return null;

      // Verifica primeiro na tabela 'managers'
      const { data: manager, error: managerError } = await supabase
        .from("managers")
        .select("id,user_id")
        .eq("user_id", user.id)
        .single();

      if (managerError && managerError.code !== "PGRST116") {
        console.error("Error fetching manager:", managerError);
        return null;
      }

      if (manager) {
        return {
          type: "manager",
          relatedId: manager.user_id,
          managerId: manager.id,
        };
      } else {
        const { data: doorman, error: doormanError } = await supabase
          .from("doormen")
          .select("id,user_id, manager:managers!inner(user_id)")
          .eq("user_id", user.id)
          .single();

        if (doormanError && doormanError.code !== "PGRST116") {
          console.error("Error fetching doormen:", doormanError);
          return null;
        }

        if (doorman) {
          return {
            type: "doorman",
            relatedId: Object(doorman.manager).user_id || null,
            managerId: Object(doorman.manager).id || null,
            doormanUserId: doorman?.user_id,
            doormenId: doorman.id,
          };
        }
      }

      return null; // Retorna null se não encontrar o usuário em nenhuma das tabelas
    },
    enabled: !!user, // Só executa a query se o usuário estiver autenticado
  });
};
