import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Package = Database['public']['Tables']['packages']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
};

interface Alert {
  id: string;
  type: 'delayed' | 'storage' | 'notification' | 'priority';
  message: string;
  package?: Package;
  createdAt: string;
}

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const alerts: Alert[] = [];

      // Get delayed packages (>7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: delayedPackages, error: delayedError } = await supabase
        .from('packages')
        .select(`
          *,
          apartment:apartments (
            *,
            building:buildings (*)
          )
        `)
        .eq('status', 'pending')
        .lt('received_at', sevenDaysAgo.toISOString());

      if (delayedError) throw delayedError;

      delayedPackages?.forEach((pkg) => {
        alerts.push({
          id: `delayed-${pkg.id}`,
          type: 'delayed',
          message: `Encomenda para ${pkg.apartment.building.name} - ${pkg.apartment.number} aguardando retirada há mais de 7 dias`,
          package: pkg as Package,
          createdAt: new Date().toISOString(),
        });
      });

      // Get storage alerts (>80% capacity)
      const { data: pendingPackages, error: pendingError } = await supabase
        .from('packages')
        .select('*')
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      const storageCapacity = 100; // Example capacity
      const currentOccupation = pendingPackages?.length || 0;
      const occupationPercentage = (currentOccupation / storageCapacity) * 100;

      if (occupationPercentage > 80) {
        alerts.push({
          id: 'storage-critical',
          type: 'storage',
          message: `Armazenamento crítico: ${occupationPercentage.toFixed(
            1
          )}% da capacidade utilizada`,
          createdAt: new Date().toISOString(),
        });
      }

      return alerts.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}