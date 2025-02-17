import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { getDaysPeriod } from "@/helpers/filterDashboard";
import { useUserType } from "./queryUser";

type Package = Database["public"]["Tables"]["packages"]["Row"] & {
  apartment: Database["public"]["Tables"]["apartments"]["Row"] & {
    building: Database["public"]["Tables"]["buildings"]["Row"];
  };
};

interface Alert {
  id: string;
  type: "delayed" | "storage" | "notification" | "priority";
  message: string;
  package?: Package;
  createdAt: string;
}

export function useAlerts(period: string, apartment?: any) {
  const userTypeQuery = useUserType();
  return useQuery({
    queryKey: ["alerts", period, apartment],
    queryFn: async () => {
      const alerts: Alert[] = [];
      const userType = await userTypeQuery.data;

      const { start, end } = getDaysPeriod(period);

      let query = supabase
        .from("packages")
        .select(
          `
          *,
          apartment:apartments (
            *,
            building:buildings (*)
          )
        `
        )
        .eq("status", "pending")
        .eq("created_by_user_id", userType)
        .gte("received_at", start.toISOString())
        .lt("received_at", end.toISOString())
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (apartment) {
        query = query.eq("apartment.id", apartment);
      }

      const { data: delayedPackages, error: delayedError } = await query;

      if (delayedError) throw delayedError;

      delayedPackages?.forEach((pkg) => {
        alerts.push({
          id: `delayed-${pkg.id}`,
          type: "delayed",
          message: `Encomenda para ${pkg.apartment.building.name} - ${pkg.apartment.number} aguardando retirada há mais de 7 dias`,
          package: pkg as Package,
          createdAt: new Date().toISOString(),
        });
      });

      // Get storage alerts (>80% capacity)
      let queryPedingAlert = supabase
        .from("packages")
        .select(`*,apartment:apartments (*)`)
        .eq("status", "pending")
        .eq("created_by_user_id", userType)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());

      if (apartment) {
        queryPedingAlert = queryPedingAlert.eq("apartment.id", apartment);
      }

      const { data: pendingPackages, error: pendingError } =
        await queryPedingAlert;

      if (pendingError) throw pendingError;

      const storageCapacity = 100; // Example capacity
      const currentOccupation = pendingPackages?.length || 0;
      const occupationPercentage = (currentOccupation / storageCapacity) * 100;

      if (occupationPercentage > 80) {
        alerts.push({
          id: "storage-critical",
          type: "storage",
          message: `Armazenamento crítico: ${occupationPercentage.toFixed(
            1
          )}% da capacidade utilizada`,
          createdAt: new Date().toISOString(),
        });
      }

      return alerts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled: !userTypeQuery.isLoading,
  });
}
