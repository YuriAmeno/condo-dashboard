import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type DoormanHistory = Database['public']['Tables']['doormen_history']['Row'];

export function useDoormanHistory(doormanId: string | null) {
  return useQuery({
    queryKey: ['doorman-history', doormanId],
    queryFn: async () => {
      if (!doormanId) return [];

      const { data, error } = await supabase
        .from('doormen_history')
        .select('*')
        .eq('doorman_id', doormanId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DoormanHistory[];
    },
    enabled: !!doormanId,
  });
}