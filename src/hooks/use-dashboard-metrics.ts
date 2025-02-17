import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { startOfDay, subDays, isAfter } from 'date-fns';

interface DashboardMetrics {
  pendingPackages: number;
  deliveredToday: number;
  delayedPackages: number;
  storageOccupation: number;
  averagePickupTime: number;
  totalNotifications: number;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const thirtyDaysAgo = subDays(today, 30);

      // Buscar todas as encomendas
      const { data: packages, error } = await supabase
        .from('packages')
        .select('*');

      if (error) throw error;

      // Filtrar encomendas pendentes
      const pendingPackages = packages.filter(p => p.status === 'pending');

      // Filtrar encomendas entregues hoje
      const deliveredToday = packages.filter(p => 
        p.status === 'delivered' && 
        p.delivered_at && 
        isAfter(new Date(p.delivered_at), today)
      );

      // Filtrar encomendas atrasadas (pendentes há mais de 7 dias)
      const delayedPackages = pendingPackages.filter(p =>
        isAfter(today, subDays(new Date(p.received_at), 7))
      );

      // Calcular tempo médio de retirada (últimos 30 dias)
      const recentDeliveries = packages.filter(p => 
        p.status === 'delivered' && 
        p.delivered_at &&
        isAfter(new Date(p.delivered_at), thirtyDaysAgo)
      );

      const totalPickupTime = recentDeliveries.reduce((acc, p) => {
        if (p.delivered_at) {
          const pickupTime = new Date(p.delivered_at).getTime() - new Date(p.received_at).getTime();
          return acc + pickupTime;
        }
        return acc;
      }, 0);

      const averagePickupTime = recentDeliveries.length > 0
        ? totalPickupTime / recentDeliveries.length
        : 0;

      // Calcular ocupação do armazenamento (considerando capacidade máxima de 100)
      const storageCapacity = 100;
      const storageOccupation = (pendingPackages.length / storageCapacity) * 100;

      const metrics: DashboardMetrics = {
        pendingPackages: pendingPackages.length,
        deliveredToday: deliveredToday.length,
        delayedPackages: delayedPackages.length,
        storageOccupation: Math.min(storageOccupation, 100),
        averagePickupTime,
        totalNotifications: 0, // Será implementado quando o sistema de notificações estiver pronto
      };

      return metrics;
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutos
  });
}