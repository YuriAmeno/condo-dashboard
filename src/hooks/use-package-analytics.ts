import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { subDays, format } from "date-fns";
import { useUserType } from "./queryUser";
import { getDaysPeriod } from "@/helpers/filterDashboard";
import {
  DailyStats,
  BuildingStats,
  HourlyStats,
  StatusStats,
  DeliveryHeatmapItem,
  PackageAnalytics
} from "@/pages/packages/core/_models";

// Interface simplificada para Package
interface Package {
  id: string;
  created_at: string;
  received_at?: string;
  delivered_at?: string;
  notified_at?: string;
  status: string;
  size?: string;
  carrier?: string;
  apartment?: {
    id: string;
    building?: {
      id: string;
      name: string;
      manager?: {
        apartment_complex_id: string;
      }
    }
  }
}

export function usePackageAnalytics(period: string, building?: any) {
  const userTypeQuery = useUserType();

  return useQuery({
    queryKey: ["package-analytics", period, building],
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
          building:buildings!inner(*, manager:managers!inner(apartment_complex_id))
        )
        `
        )
      
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .eq("apartment.building.manager.apartment_complex_id", userType?.apartment_complex_id);

       if (building) {
        query = query.eq("apartment.building.id", building);
      }

      const { data: packages, error } = await query;
      if (error) throw error;

      // Garantir que packages é tratado como um array seguro
      const safePackages: Package[] = packages || [];

      // Determina o tamanho do array de estatísticas diárias
      let lengthArray = 2;
      if (period === "week") lengthArray = 7;
      if (period === "month") lengthArray = 30;

      // Daily stats
      const dailyStats: DailyStats[] = Array.from(
        { length: lengthArray },
        (_, i) => {
          const date = format(subDays(end, i), "yyyy-MM-dd");
          const dayPackages = safePackages.filter((p) =>
            p.created_at?.startsWith(date)
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
      safePackages.forEach((p) => {
        const buildingName = p.apartment?.building?.name || "Desconhecido";
        if (!buildingMap.has(buildingName)) {
          buildingMap.set(buildingName, {
            building: buildingName,
            name: buildingName,
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
          received: safePackages.filter(
            (p) => p.received_at && new Date(p.received_at).getHours() === hour
          ).length,
          delivered: safePackages.filter(
            (p) =>
              p.delivered_at && new Date(p.delivered_at).getHours() === hour
          ).length,
        })
      );

      // Status stats
      const total = safePackages.length;
      const statusStats: StatusStats[] = [
        {
          status: "Pendente",
          count: safePackages.filter((p) => p.status === "pending").length,
          percentage: 0,
        },
        {
          status: "Entregue",
          count: safePackages.filter((p) => p.status === "delivered").length,
          percentage: 0,
        },
      ];
      statusStats.forEach((stat) => {
        stat.percentage = total ? (stat.count / total) * 100 : 0;
      });

      // Delivery Heatmap (para o heatmap de distribuição por período)
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const hours = ['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
      
      const deliveryHeatmap: DeliveryHeatmapItem[] = [];
      
      hours.forEach(hour => {
        days.forEach(day => {
          // Simula dados ou você pode processar pacotes reais por dia/hora
          const hourNum = parseInt(hour.replace('h', ''));
          const dayIndex = days.indexOf(day);
          
          // Contagem de pacotes para esta combinação de dia/hora
          const dayPackages = safePackages.filter(p => {
            if (!p.created_at) return false;
            const date = new Date(p.created_at);
            return date.getDay() === dayIndex && date.getHours() === hourNum;
          });
          
          deliveryHeatmap.push({
            hour,
            day,
            count: dayPackages.length
          });
        });
      });

      return {
        dailyStats,
        buildingStats,
        hourlyStats,
        statusStats,
        deliveryHeatmap
      } as PackageAnalytics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    enabled: !!userTypeQuery.data,
  });
}
