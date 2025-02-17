import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Resident = Database['public']['Tables']['residents']['Row'];

interface ResidentWithDetails extends Resident {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
  pending_packages: number;
  last_package?: Database['public']['Tables']['packages']['Row'];
}

interface CreateResidentData {
  name: string;
  apartment_id: string;
  phone: string;
  email: string;
  receive_notifications?: boolean;
}

interface UpdateResidentData extends Partial<CreateResidentData> {
  id: string;
}

export function useResidentManagement() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['residents-with-details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residents')
        .select(`
          *,
          apartment:apartments!inner (
            *,
            building:buildings!inner (*)
          ),
          packages (*)
        `)
        .order('name');

      if (error) throw error;

      return data.map((resident) => {
        const pendingPackages = resident.packages?.filter(
          (p: { status: string }) => p.status === 'pending'
        ).length || 0;

        const lastPackage = resident.packages
          ?.sort(
            (a: { received_at: string }, b: { received_at: string }) =>
              new Date(b.received_at).getTime() -
              new Date(a.received_at).getTime()
          )
          .at(0);

        return {
          ...resident,
          pending_packages: pendingPackages,
          last_package: lastPackage,
        };
      }) as ResidentWithDetails[];
    },
  });

  const createResident = useMutation({
    mutationFn: async (data: CreateResidentData) => {
      const { error } = await supabase.from('residents').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents-with-details'] });
    },
  });

  const updateResident = useMutation({
    mutationFn: async ({ id, ...data }: UpdateResidentData) => {
      const { error } = await supabase
        .from('residents')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents-with-details'] });
    },
  });

  return {
    residents: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createResident,
    updateResident,
  };
}