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
  type: "delayed" | "storage" | "notification" | "priority" | string;
  message: string;
  package?: Package;
  createdAt: string;
}

export function useAlerts(period: string, apartment?: any) {
  const userTypeQuery = useUserType();
  return useQuery({
    queryKey: ["alerts", period, apartment],
    queryFn: async () => {
      try {
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
          .eq("created_by_user_id", userType?.relatedId)
          .gte("received_at", start.toISOString())
          .lt("received_at", end.toISOString());

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

        try {
          const { data: pendingPackages, error: pendingError } = await query;
          if (pendingError) throw pendingError;

          console.log("PENDING PACKAGES RECEIVED:", pendingPackages);

          if (!pendingPackages || pendingPackages.length === 0) {
            console.log("No pending packages found.");
            return [];
          }

          const newAlerts = pendingPackages.map((pkg) => ({
            id: `delayed-${pkg.id}`,
            type: "delayed",
            message: `Encomenda para ${pkg.apartment?.building?.name} - ${pkg?.apartment?.number} aguardando retirada há mais de 7 dias`,
            package: pkg as Package,
            createdAt: new Date().toISOString(),
          }));

          alerts.push(...newAlerts);
          console.log("ALERTS AFTER MAPPING:", alerts);

          const storageCapacity = 100; // Example capacity
          const currentOccupation = pendingPackages?.length || 0;
          const occupationPercentage =
            (currentOccupation / storageCapacity) * 100;

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

          console.log("FINAL ALERTS:", alerts);
          return alerts.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } catch (err) {
          console.error("Error processing alerts:", err);
          return [];
        }
      } catch (err) {
        console.error("ERROR IN ALERT FUNCTION:", err);
        return [];
      }
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled: !userTypeQuery.isLoading,
  });
}
