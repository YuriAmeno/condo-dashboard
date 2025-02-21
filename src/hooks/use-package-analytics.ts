import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { subDays, format } from "date-fns";
import { useUserType } from "./queryUser";
import { getDaysPeriod } from "@/helpers/filterDashboard";

interface DailyStats {
  date: string;
  received: number;
  delivered: number;
}

interface BuildingStats {
  building: string;
  pending: number;
  delivered: number;
  total: number;
}

interface HourlyStats {
  hour: number;
  received: number;
  delivered: number;
}

interface StatusStats {
  status: string;
  count: number;
  percentage: number;
}

interface PackageAnalytics {
  dailyStats: DailyStats[];
  buildingStats: BuildingStats[];
  hourlyStats: HourlyStats[];
  statusStats: StatusStats[];
}

export function usePackageAnalytics(period: string, apartment?: any) {
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["package-analytics", period, apartment],
    queryFn: async () => {
      const userType = userTypeQuery.data;
      if (!userType) return;

      const { start, end } = getDaysPeriod(period);

      let query = supabase
        .from("packages")
        .select(
          `
          *,
          apartment:apartments!inner(
          id,
          building:buildings!inner(*)
        )
        `
        )
        // .neq("apartment.building_id", "")
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

      // Determina o tamanho do array de estatísticas diárias
      let lengthArray = 2;
      if (period === "week") lengthArray = 7;
      if (period === "month") lengthArray = 30;

      // Daily stats
      const dailyStats: DailyStats[] = Array.from(
        { length: lengthArray },
        (_, i) => {
          const date = format(subDays(end, i), "yyyy-MM-dd");
          const dayPackages = packages.filter((p) =>
            p.created_at.startsWith(date)
          );
          return {
            date,
            received: dayPackages.length,
            delivered: dayPackages.filter((p) => p.status === "delivered")
              .length,
          };
        }
      ).reverse();

      // Building stats
      const buildingMap = new Map<string, BuildingStats>();
      packages.forEach((p) => {
        const buildingName = p.apartment?.building?.name || "Desconhecido";
        if (!buildingMap.has(buildingName)) {
          buildingMap.set(buildingName, {
            building: buildingName,
            pending: 0,
            delivered: 0,
            total: 0,
          });
        }
        const stats = buildingMap.get(buildingName)!;
        stats.total++;
        if (p.status === "delivered") {
          stats.delivered++;
        } else {
          stats.pending++;
        }
      });
      const buildingStats = Array.from(buildingMap.values());

      // Hourly stats
      const hourlyStats: HourlyStats[] = Array.from({ length: 24 }).map(
        (_, hour) => ({
          hour,
          received: packages.filter(
            (p) => new Date(p.received_at).getHours() === hour
          ).length,
          delivered: packages.filter(
            (p) =>
              p.delivered_at && new Date(p.delivered_at).getHours() === hour
          ).length,
        })
      );

      // Status stats
      const total = packages.length;
      const statusStats: StatusStats[] = [
        {
          status: "Pendente",
          count: packages.filter((p) => p.status === "pending").length,
          percentage: 0,
        },
        {
          status: "Entregue",
          count: packages.filter((p) => p.status === "delivered").length,
          percentage: 0,
        },
      ];
      statusStats.forEach((stat) => {
        stat.percentage = total ? (stat.count / total) * 100 : 0;
      });

      return {
        dailyStats,
        buildingStats,
        hourlyStats,
        statusStats,
      } as PackageAnalytics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    enabled: !!userTypeQuery.data,
  });
}
