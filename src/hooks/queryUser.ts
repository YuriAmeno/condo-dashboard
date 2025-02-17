import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export const useUserType = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_type", user?.id], // Mantém o cache por usuário específico
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;

      // Verifica primeiro na tabela 'managers'
      const { data: managers, error: managerError } = await supabase
        .from("managers")
        .select("user_id")
        .eq("user_id", user.id)
        .single(); // Usa single() para pegar apenas um registro

      if (managerError) {
        console.error("Error fetching manager:", managerError);
        return null;
      }

      if (managers) {
        return managers.user_id; // Retorna o ID se for um manager
      }

      // Se não for manager, verifica na tabela 'doormen'
      const { data: doormen, error: doormenError } = await supabase
        .from("doormen")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (doormenError) {
        console.error("Error fetching doormen:", doormenError);
        return null;
      }

      if (doormen) {
        return doormen.user_id; // Retorna o ID se for um doorman
      }

      return null; // Retorna null se não encontrar o usuário em nenhuma das tabelas
    },
    enabled: !!user, // Só executa a query se o usuário estiver autenticado
  });
};
