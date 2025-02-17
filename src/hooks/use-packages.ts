import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Database } from '@/types/supabase';

type Package = Database['public']['Tables']['packages']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
  resident: Database['public']['Tables']['residents']['Row'] | null;
};

interface UsePackagesOptions {
  status?: 'pending' | 'delivered';
  buildingId?: string;
  residentId?: string;
  limit?: number;
}

export function usePackages(options: UsePackagesOptions = {}) {
  // const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['packages', options, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('packages')
        .select(`
          *,
          apartment:apartments (
            *,
            building:buildings (*)
          ),
          resident:residents (*)
        `);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.buildingId) {
        query = query.eq('apartment.building_id', options.buildingId);
      }

      if (options.residentId) {
        query = query.eq('resident_id', options.residentId);
      }

      query = query.order('received_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as Package[];
    },
    refetchInterval: options.status === 'pending' ? 30 * 1000 : false,
    enabled: !!user,
  });

  return query;

  // ... resto do código permanece igual
}