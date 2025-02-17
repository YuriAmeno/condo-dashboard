import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Package = Database['public']['Tables']['packages']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
};

export function usePackageByQR(qrCode: string | null) {
  return useQuery({
    queryKey: ['package', qrCode],
    queryFn: async () => {
      if (!qrCode) return null;

      const { data, error } = await supabase
        .from('packages')
        .select(`
          *,
          apartment:apartments (
            *,
            building:buildings (*)
          )
        `)
        .eq('qr_code', qrCode)
        .single();

      if (error) throw error;
      return data as Package;
    },
    enabled: !!qrCode,
  });
}