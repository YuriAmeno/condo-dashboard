import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";

type Building = Database["public"]["Tables"]["buildings"]["Row"];

export function useBuildings(period: string, building?: any) {
  const { user } = useAuth();
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["buildings", user?.id, period, building],
    queryFn: async () => {
      const userType = await userTypeQuery.data;

      let query = supabase
        .from("buildings")
        .select(
          `
          *, manager:managers!inner(apartment_complex_id),
          apartment:apartments (
            *
          )
        `
        )
        .eq("manager.apartment_complex_id", userType?.apartment_complex_id)

        .order("name");

       

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching buildings:", error);
        throw error;
      }

      return data as Building[];
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user && !!userTypeQuery.data,
  });
}

export function useBuildingsList() {
  const { user } = useAuth();
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["buildings", user?.id],
    queryFn: async () => {
      const userType = userTypeQuery.data;

      const { data, error } = await supabase
        .from("buildings")
        .select(
          `
          *,
          manager:managers!inner(apartment_complex_id),
          apartment:apartments (
            *
          )
        `
        )
        .eq("manager.apartment_complex_id", userType?.apartment_complex_id)

        .order("name");

      if (error) {
        console.error("Error fetching buildings:", error);
        throw error;
      }

      return data as Building[];
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user && !!userTypeQuery.data,
  });
}
