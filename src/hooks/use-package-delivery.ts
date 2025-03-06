import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Package = Database['public']['Tables']['packages']['Row'];

interface DeliveryData {
  packageId: string;
  notes?: string;
  signatureId?: string;
}

export function usePackageDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ packageId, notes, signatureId }: DeliveryData) => {
      const { data, error } = await supabase
        .from('packages')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          notes: notes || null,
          signature_id: signatureId || null,
        })
        .eq('id', packageId)
        .select()
        .single();

      if (error) throw error;
      return data as Package;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['recent-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
  });
}