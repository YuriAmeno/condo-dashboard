import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Apartment = Database['public']['Tables']['apartments']['Row'];
type Package = Database['public']['Tables']['packages']['Row'];
type Resident = Database['public']['Tables']['residents']['Row'];

interface ApartmentWithDetails extends Apartment {
  residents: Resident[];
  packages: Package[];
  building: Database['public']['Tables']['buildings']['Row'];
}

interface CreateApartmentData {
  building_id: string;
  number: string;
}

interface UpdateApartmentData {
  id: string;
  number: string;
}

export function useApartmentManagement(buildingId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['apartments-with-details', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];

      const { data, error } = await supabase
        .from('apartments')
        .select(`
          *,
          building:buildings (*),
          residents:residents (*),
          packages:packages (*)
        `)
        .eq('building_id', buildingId)
        .order('number');

      if (error) throw error;

      return data as ApartmentWithDetails[];
    },
    enabled: !!buildingId,
  });

  const createApartment = useMutation({
    mutationFn: async (data: CreateApartmentData) => {
      const { error } = await supabase.from('apartments').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['apartments-with-details', buildingId],
      });
    },
  });

  const updateApartment = useMutation({
    mutationFn: async ({ id, ...data }: UpdateApartmentData) => {
      const { error } = await supabase
        .from('apartments')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['apartments-with-details', buildingId],
      });
    },
  });

  return {
    apartments: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createApartment,
    updateApartment,
  };
}