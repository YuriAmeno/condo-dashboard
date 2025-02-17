import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { startOfDay, subDays, isAfter } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useUserType } from "./queryUser";

interface DashboardMetrics {
  pendingPackages: number;
  deliveredToday: number;
  delayedPackages: number;
  storageOccupation: number;
  averagePickupTime: number;
  totalNotifications: number;
}

export const useDashboardMetrics = () => {
  const { user } = useAuth();
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const thirtyDaysAgo = subDays(today, 30);

      // Wait for user type to be determined
      const userType = await userTypeQuery.data;

      // Fetch packages with apartment join and user_id filter
      const { data: packages, error } = await supabase
        .from("packages")
        .select("*, apartments!inner(id)")
        .eq("apartments.user_id", userType);

      if (error) throw error;

      // Filter pending packages
      const pendingPackages = packages.filter((p) => p.status === "pending");

      // Filter packages delivered today
      const deliveredToday = packages.filter(
        (p) =>
          p.status === "delivered" &&
          p.delivered_at &&
          isAfter(new Date(p.delivered_at), today)
      );

      // Filter delayed packages (pending for more than 7 days)
      const delayedPackages = pendingPackages.filter((p) =>
        isAfter(today, subDays(new Date(p.received_at), 7))
      );

      // Calculate average pickup time (last 30 days)
      const recentDeliveries = packages.filter(
        (p) =>
          p.status === "delivered" &&
          p.delivered_at &&
          isAfter(new Date(p.delivered_at), thirtyDaysAgo)
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
