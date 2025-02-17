import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";

type Resident = Database["public"]["Tables"]["residents"]["Row"] & {
  apartment: Database["public"]["Tables"]["apartments"]["Row"] & {
    building: Database["public"]["Tables"]["buildings"]["Row"];
  };
  packages?: Array<Database["public"]["Tables"]["packages"]["Row"]>;
};

interface UpdateBuildingData {
  id: string;
  data: any;
}

interface DeleteBuildingData {
  id: string;
}

export function useResidents() {
  const { user } = useAuth();
  const userTypeQuery = useUserType();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["residents", user?.id],
    queryFn: async () => {
      const userType = userTypeQuery.data;
      const { data, error } = await supabase
        .from("residents")
        .select(
          `
          *,
          apartment:apartments!inner (
            *,
            building:buildings!inner (*)
          ),
          packages:packages (*)
        `
        )
        .eq("apartment.building.user_id", userType)
        .order("name");

      if (error) {
        console.error("Error fetching residents:", error);
        throw error;
      }

      console.log("Residents fetched:", data);
      return data as Resident[];
    },
    enabled: !!user && !!userTypeQuery.data,
    staleTime: 1000 * 30, // 30 seconds
  });

  const updateResidents = useMutation({
    mutationFn: async ({ id, ...data }: UpdateBuildingData) => {
      const { error } = await supabase
        .from("residents")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residents-with-update"] });
    },
  });

  const deleteResident = useMutation({
    mutationFn: async ({ id }: DeleteBuildingData) => {
      const { error } = await supabase.from("residents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residents-with-delete"] });
    },
  });

  return {
    residents: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateResidents,
    deleteResident,
  };
}
