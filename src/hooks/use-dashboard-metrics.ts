import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfDay, subDays, isAfter } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useUserType } from "./queryUser";
import { getDaysPeriod } from "@/helpers/filterDashboard";

interface DashboardMetrics {
  pendingPackages: number;
  deliveredToday: number;
  delayedPackages: number;
  storageOccupation: number;
  averagePickupTime: number;
  totalNotifications: number;
}

export const useDashboardMetrics = (period: string, apartment?: any) => {
  const { user } = useAuth();
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["dashboard-metrics", period, apartment],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const userType = userTypeQuery.data;

      const { start, end } = getDaysPeriod(period);

      let query = supabase
        .from("packages")
        .select(
          `*,apartment:apartments!inner(
          id,
          user_id,
          building:buildings(*)
        )`
        )
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

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

        query = query.in("apartment.building.user_id", doormenIds);
      } else {
        query = query.in("apartment.building.user_id", [
          userType?.relatedId,
          userType?.doormanUserId,
        ]);
      }

      const { data: packages, error } = await query;

      if (error) throw error;

      const pendingPackages = packages.filter((p) => p.status === "pending");

      // Filter packages delivered today
      const deliveredToday = packages.filter(
        (p) =>
          p.status === "delivered" &&
          p.delivered_at &&
          isAfter(new Date(p.delivered_at), today)
      );

      const delayedPackages = pendingPackages.filter((p) =>
        isAfter(subDays(today, 7), new Date(p.received_at))
      );

      // Calculate average pickup time (last 30 days)
      const recentDeliveries = packages.filter(
        (p) => p.status === "delivered" && p.delivered_at
      );

      const totalPickupTime = recentDeliveries.reduce((acc, p) => {
        if (p.delivered_at) {
          const pickupTime =
            new Date(p.delivered_at).getTime() -
            new Date(p.received_at).getTime();
          return acc + pickupTime;
        }
        return acc;
      }, 0);

      const averagePickupTime =
        recentDeliveries.length > 0
          ? totalPickupTime / recentDeliveries.length
          : 0;

      // Calculate storage occupation (max capacity of 100)
      const storageCapacity = 100;
      const storageOccupation =
        (pendingPackages.length / storageCapacity) * 100;

      const metrics: DashboardMetrics = {
        pendingPackages: pendingPackages.length,
        deliveredToday: deliveredToday.length,
        delayedPackages: delayedPackages.length,
        storageOccupation: Math.min(storageOccupation, 100),
        averagePickupTime,
        totalNotifications: 0, // Will be implemented when notification system is ready
      };

      return metrics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled: !!user && !userTypeQuery.isLoading,
  });
};
