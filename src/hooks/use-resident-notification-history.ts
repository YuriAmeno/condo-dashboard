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
            package:packages!inner(*)
          )
        `
        )

        .eq("queue.resident_id", residentId)
        .order("created_at", { ascending: false });

      if (userType?.type === "manager") {
        const { data: doormen, error: doormenError } = await supabase
          .from("doormen")
          .select("user_id")
          .eq("manager_id", userType.managerId);

        if (doormenError) {
          console.error("Error fetching doormen:", doormenError);
          return null;
        }

        const doormenIds = doormen.map((d) => d.user_id);
        doormenIds.push(userType.relatedId);

        query = query.in("queue.resident.user_id", doormenIds);
      } else {
        query = query.in("queue.resident.user_id", [
          userType?.relatedId,
          userType?.doormanUserId,
        ]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NotificationLog[];
    },
    enabled: !!residentId && !!userTypeQuery.data,
  });
}
