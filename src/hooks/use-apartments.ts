import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/types/supabase";

type Apartment = Database["public"]["Tables"]["apartments"]["Row"];

export function useApartments(buildingId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["apartments", buildingId, user?.id],
    queryFn: async () => {
      if (!buildingId) return [];

      // Buscar apartments vinculados ao usuário atual através do relacionamento
      // apartments -> buildings -> managers -> user_id
      const { data, error } = await supabase
        .from("apartments")
        .select("*")
        .eq("building_id", buildingId)
        .order("number");

      if (error) {
        console.error("Error fetching apartments:", error);
        throw error;
      }

      return data as Apartment[];
    },
    enabled: !!buildingId && !!user,
  });
}
