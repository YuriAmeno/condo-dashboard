import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfDay, subDays, format } from 'date-fns';

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

export function usePackageAnalytics() {
  return useQuery({
    queryKey: ['package-analytics'],
    queryFn: async () => {
      const endDate = startOfDay(new Date());
      const startDate = subDays(endDate, 7);

      const { data: packages, error } = await supabase
        .from('packages')
        .select(`
          *,
          apartment:apartments (
            building:buildings (
              name
            )
          )
        `)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Daily stats
      const dailyStats: DailyStats[] = Array.from({ length: 7 }).map((_, i) => {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd');
        const dayPackages = packages.filter((p) =>
          p.created_at.startsWith(date)
        );
        return {
          date,
          received: dayPackages.length,
          delivered: dayPackages.filter((p) => p.status === 'delivered').length,
        };
      }).reverse();

      // Building stats
      const buildingMap = new Map<string, BuildingStats>();
      packages.forEach((p) => {
        const buildingName = p.apartment.building.name;
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
        if (p.status === 'delivered') {
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
          status: 'Pendente',
          count: packages.filter((p) => p.status === 'pending').length,
          percentage: 0,
        },
        {
          status: 'Entregue',
          count: packages.filter((p) => p.status === 'delivered').length,
          percentage: 0,
        },
      ];
      statusStats.forEach((stat) => {
        stat.percentage = (stat.count / total) * 100;
      });

      return {
        dailyStats,
        buildingStats,
        hourlyStats,
        statusStats,
      } as PackageAnalytics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}