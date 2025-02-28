import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";

type NotificationLog =
  Database["public"]["Tables"]["notification_logs"]["Row"] & {
    queue: {
      resident: Pick<
        Database["public"]["Tables"]["residents"]["Row"],
        "name" | "phone"
      >;
      template: Pick<
        Database["public"]["Tables"]["notification_templates"]["Row"],
        "type" | "title"
      >;
      package: Database["public"]["Tables"]["packages"]["Row"] | null;
    };
  };

export function useResidentNotificationHistory(residentId: string | null) {
  const userTypeQuery = useUserType();
  return useQuery({
    queryKey: ["resident-notification-history", residentId],
    queryFn: async () => {
      if (!residentId) return [];
      const userType = userTypeQuery.data;

      let query = supabase
        .from("notification_logs")
        .select(
          `
          *,
          queue:notification_queue!inner(
            resident:residents!inner(
              name,
              phone,
              user_id
            ),
            template:notification_templates!inner(
              type,
              title
            ),
            package:packages!inner(*, apartment:apartments!inner(building:buildings!inner(id, manager:managers!inner(apartment_complex_id))))
          )
        `
        )

        .eq("queue.resident_id", residentId)
        .eq("queue.apartment.building.manager.apartment_complex_id", userType?.apartment_complex_id)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data as NotificationLog[];
    },
    enabled: !!residentId && !!userTypeQuery.isLoading,
  });
}
