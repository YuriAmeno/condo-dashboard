import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";

type Package = Database["public"]["Tables"]["packages"]["Row"] & {
  apartment: Database["public"]["Tables"]["apartments"]["Row"] & {
    building: Database["public"]["Tables"]["buildings"]["Row"];
  };
};

export function useRecentDeliveries() {
  const userTypeQuery = useUserType();
  return useQuery({
    queryKey: ["recent-deliveries"],
    queryFn: async () => {
      const userType = userTypeQuery.data;
      let query = supabase
        .from("packages")
        .select(
          `
          *,
          apartment:apartments!inner(
            *,
            building:buildings!inner(*)
          )
        `
        )
        .eq("status", "delivered")

        .order("delivered_at", { ascending: false })
        .limit(10);

      if (userType?.type === "manager") {
        const { data: doormen, error: doormenError } = await supabase
          .from("doormen")
          .select("user_id")
          .eq("manager_id", userType.relatedId);

        if (doormenError) {
          console.error("Error fetching doormen:", doormenError);
          return null;
        }

        const doormenIds = doormen.map((d) => d.user_id);
        doormenIds.push(userType.relatedId);

        query = query.in("apartment.user_id", doormenIds);
      } else {
        query = query.in("apartment.user_id", [
          userType?.relatedId,
          userType?.doormanUserId,
        ]);
      }

      const { data: packages, error } = await query;

      if (error) throw error;
      return packages as Package[];
    },
    refetchInterval: 30 * 1000, // 30 seconds
  });
}
