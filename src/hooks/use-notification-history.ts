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

interface NotificationHistoryFilters {
  residentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export function useNotificationHistory(filters?: NotificationHistoryFilters) {
  const userTypeQuery = useUserType();
  return useQuery({
    queryKey: ["notification-history", filters],
    queryFn: async () => {
      const userType = userTypeQuery.data;
      let query = supabase
        .from("notification_logs")
        .select(
          `
          *,
          queue:notification_queue!inner(
            resident:residents!inner(
              name,
              phone
            ),
            template:notification_templates (
              type,
              title
            ),
            package:packages!inner(*, apartment:apartments!inner(*,building:buildings!inner(*)))
          )
        `
        )
        .order("created_at", { ascending: false });

      if (filters?.residentId) {
        query = query.eq("queue.resident_id", filters.residentId);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

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

        query = query.in(
          "queue.package.apartment.building.user_id",
          doormenIds
        );
      } else {
        query = query.in("queue.package.apartment.building.user_id", [
          userType?.relatedId,
          userType?.doormanUserId,
        ]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NotificationLog[];
    },
  });
}
