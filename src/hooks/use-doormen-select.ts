import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Doorman = Database['public']['Tables']['doormen']['Row'];

export function useDoormenSelect() {
  return useQuery({
    queryKey: ['doormen-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('doormen')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data as Pick<Doorman, 'id' | 'name'>[];
    },
  });
}