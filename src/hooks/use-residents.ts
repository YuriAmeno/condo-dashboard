import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Database } from '@/types/supabase';

type Resident = Database['public']['Tables']['residents']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
  packages?: Array<Database['public']['Tables']['packages']['Row']>;
};

export function useResidents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['residents', user?.id],
    queryFn: async () => {
      console.log('Fetching residents...');
      
      const { data, error } = await supabase
        .from('residents')
        .select(`
          *,
          apartment:apartments!inner (
            *,
            building:buildings!inner (*)
          ),
          packages:packages (*)
        `)
        .order('name');

      if (error) {
        console.error('Error fetching residents:', error);
        throw error;
      }

      console.log('Residents fetched:', data);
      return data as Resident[];
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
  });
}