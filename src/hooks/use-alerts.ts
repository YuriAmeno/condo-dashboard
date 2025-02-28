import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { getDaysPeriod } from "@/helpers/filterDashboard";
import { useUserType } from "./queryUser";
import moment from "moment";

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

const getPendingTime = (receivedAt: string) => {
  const duration = moment.duration(moment().diff(moment(receivedAt)));

  if (duration.days() > 0) return `${duration.days()} dia(s)`;
  if (duration.hours() > 0) return `${duration.hours()} hora(s)`;
  return `${duration.minutes()} minuto(s)`;
};

export function useAlerts(period: string, building?: any) {
  const userTypeQuery = useUserType();
  return useQuery({
    queryKey: ["alerts", period, building],
    queryFn: async () => {
      const alerts: Alert[] = [];
      const userType = userTypeQuery.data;

      const { start, end } = getDaysPeriod(period);

      let query = supabase
        .from("packages")
        .select(
          `
          *,
          apartment:apartments!inner(*,building:buildings!inner(*, manager:managers!inner(apartment_complex_id))),
           resident:residents(*)
        `
        )
        .eq("status", "pending")
        .gte("received_at", start.toISOString())
        .lt("received_at", end.toISOString())
        .eq("apartment.building.manager.apartment_complex_id", userType?.apartment_complex_id);

      if (building) {
        query = query.eq("apartment.building.id", building);
      }

      const { data: pendingPackages, error: pendingError } = await query;
      if (pendingError) throw pendingError;

      if (!pendingPackages || pendingPackages.length === 0) {
        return [];
      }

      const newAlerts = pendingPackages.map((pkg) => {
        const pendingTime = getPendingTime(pkg.received_at);

        let dta = {
          id: `delayed-${pkg.id}`,
          type: "delayed",
          message: `Encomenda para ${pkg.resident?.name} / ${pkg.apartment?.building?.name} - ${pkg?.apartment?.number} aguardando retirada há mais de ${pendingTime}`,
          package: pkg as Package,
          createdAt: new Date().toISOString(),
        };
        return dta;
      });

      alerts.push(...newAlerts);

      const storageCapacity = 100;
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
