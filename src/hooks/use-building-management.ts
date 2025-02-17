import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type Building = Database['public']['Tables']['buildings']['Row'];

interface BuildingWithStats extends Building {
  total_apartments: number;
  total_residents: number;
  pending_packages: number;
  occupation_rate: number;
}

interface CreateBuildingData {
  name: string;
}

interface UpdateBuildingData {
  id: string;
  name: string;
}

export function useBuildingManagement() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['buildings-with-stats'],
    queryFn: async () => {
      const { data: buildings, error: buildingsError } = await supabase
        .from('buildings')
        .select(`
          *,
          apartments:apartments (
            id,
            residents:residents (id),
            packages:packages (id, status)
          )
        `)
        .order('name');

      if (buildingsError) throw buildingsError;

      return buildings.map((building) => {
        const totalApartments = building.apartments?.length || 0;
        const totalResidents = building.apartments?.reduce(
          (acc: number, apt: { residents?: any[] }) => acc + (apt.residents?.length || 0),
          0
        ) || 0;
        const pendingPackages = building.apartments?.reduce(
          (acc: number, apt: { packages?: any[] }) =>
            acc +
            (apt.packages?.filter((p: { status: string }) => p.status === 'pending').length || 0),
          0
        ) || 0;
        const occupiedApartments = building.apartments?.filter(
          (apt: { residents?: any[] }) => apt.residents && apt.residents.length > 0
        ).length || 0;

        return {
          ...building,
          total_apartments: totalApartments,
          total_residents: totalResidents,
          pending_packages: pendingPackages,
          occupation_rate: totalApartments
            ? (occupiedApartments / totalApartments) * 100
            : 0,
        };
      }) as BuildingWithStats[];
    },
  });

  const createBuilding = useMutation({
    mutationFn: async (data: CreateBuildingData) => {
      const { error } = await supabase.from('buildings').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings-with-stats'] });
    },
  });

  const updateBuilding = useMutation({
    mutationFn: async ({ id, ...data }: UpdateBuildingData) => {
      const { error } = await supabase
        .from('buildings')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildings-with-stats'] });
    },
  });

  return {
    buildings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createBuilding,
    updateBuilding,
  };
}