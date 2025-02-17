import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";

type Package = Database["public"]["Tables"]["packages"]["Row"] & {
  apartment: Database["public"]["Tables"]["apartments"]["Row"] & {
    building: Database["public"]["Tables"]["buildings"]["Row"];
  };
};

export function useRecentPackages(limit = 10) {
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["recent-packages", limit],
    queryFn: async () => {
      const userType = await userTypeQuery.data;
      const { data: packages, error } = await supabase
        .from("packages")
        .select(
          `
        *,
        apartment:apartments!inner(
          id,
          building:buildings(*)
        )
        `
        )
        .eq("apartment.user_id", userType) // Passando apenas o UUID puro
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return packages as Package[];
    },
    refetchInterval: 30 * 1000, // 30 seconds
    enabled: !!userTypeQuery.data,
  });
}
