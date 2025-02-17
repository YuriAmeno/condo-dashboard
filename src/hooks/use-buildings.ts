import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Database } from '@/types/supabase';

type Building = Database['public']['Tables']['buildings']['Row'];

export function useBuildings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buildings', user?.id],
    queryFn: async () => {
      console.log('Fetching buildings...');
      
      // Buscar buildings vinculadas ao usuário atual através do manager
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching buildings:', error);
        throw error;
      }

      console.log('Buildings fetched:', data);
      return data as Building[];
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!user,
  });
}