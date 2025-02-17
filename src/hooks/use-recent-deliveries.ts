import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Package = Database['public']['Tables']['packages']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
};

export function useRecentDeliveries() {
  return useQuery({
    queryKey: ['recent-deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          apartment:apartments (
            *,
            building:buildings (*)
          )
        `)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Package[];
    },
    refetchInterval: 30 * 1000, // 30 seconds
  });
}