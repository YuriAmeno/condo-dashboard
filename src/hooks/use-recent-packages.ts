import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";
import { getDaysPeriod } from "@/helpers/filterDashboard";

type Package = Database["public"]["Tables"]["packages"]["Row"] & {
  apartment: Database["public"]["Tables"]["apartments"]["Row"] & {
    building: Database["public"]["Tables"]["buildings"]["Row"];
  };
};

export function useRecentPackages(period: string, apartment?: any) {
  const userTypeQuery = useUserType();
  const limit = 10;

  return useQuery({
    queryKey: ["recent-packages", period, apartment],
    queryFn: async () => {
      const userType = await userTypeQuery.data;
      if (!userType) return [];

      const { start, end } = getDaysPeriod(period);

      let query = supabase
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
        .eq("apartment.user_id", userType?.relatedId)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);

      if (apartment) {
        query = query.eq("apartment.building.id", apartment);
      }

      const { data: packages, error } = await query;

      if (error) throw error;
      return packages as Package[];
    },
    refetchInterval: 30 * 1000,
    enabled: !!userTypeQuery.data?.relatedId,
  });
}

export function useRecentPackagesList(limit = 10) {
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["recent-packages"],
    queryFn: async () => {
      const userType = await userTypeQuery.data;
      if (!userType) return [];

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
        .eq("apartment.user_id", userType?.relatedId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return packages as Package[];
    },
    refetchInterval: 30 * 1000,
    enabled: !!userTypeQuery.data?.relatedId,
  });
}
