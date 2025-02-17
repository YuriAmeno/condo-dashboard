import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfDay, subDays, format } from 'date-fns';

interface DailyStats {
  date: string;
  total: number;
  errors: number;
}

interface HourlyStats {
  hour: number;
  packages: number;
}

interface DoormanMetrics {
  totalPackages: number;
  packagesToday: number;
  averageTime: number | null;
  errorRate: number;
  dailyStats: DailyStats[];
  hourlyStats: HourlyStats[];
}

export function useDoormanMetrics(doormanId: string | null) {
  return useQuery({
    queryKey: ['doorman-metrics', doormanId],
    queryFn: async () => {
      if (!doormanId) return null;

      const today = startOfDay(new Date());
      const sevenDaysAgo = subDays(today, 7);

      const { data: packages, error } = await supabase
        .from('packages')
        .select('*')
        .eq('doorman_id', doormanId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      const packagesToday = packages.filter(p =>
        p.created_at.startsWith(format(today, 'yyyy-MM-dd'))
      );

      const validTimes = packages
        .map(p => {
          const received = new Date(p.received_at);
          const created = new Date(p.created_at);
          const diff = received.getTime() - created.getTime();
          return diff > 0 && diff < 3600000 ? diff : null;
        })
        .filter((time): time is number => time !== null);

      const averageTime = validTimes.length > 0
        ? validTimes.reduce((a, b) => a + b, 0) / validTimes.length
        : null;

      const errorRate = packages.length > 0
        ? (packages.filter(p => p.corrections?.length > 0).length / packages.length) * 100
        : 0;

      const dailyStats = Array.from({ length: 7 }).map((_, i) => {
        const date = format(subDays(today, i), 'yyyy-MM-dd');
        const dayPackages = packages.filter(p => p.created_at.startsWith(date));
        
        return {
          date,
          total: dayPackages.length,
          errors: dayPackages.filter(p => p.corrections?.length > 0).length,
        };
      }).reverse();

      const hourlyStats = Array.from({ length: 24 }).map((_, hour) => ({
        hour,
        packages: packages.filter(p => 
          new Date(p.created_at).getHours() === hour
        ).length,
      }));

      return {
        totalPackages: packages.length,
        packagesToday: packagesToday.length,
        averageTime,
        errorRate,
        dailyStats,
        hourlyStats,
      } as DoormanMetrics;
    },
    enabled: !!doormanId,
  });
}