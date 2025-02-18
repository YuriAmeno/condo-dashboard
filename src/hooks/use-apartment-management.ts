import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { useUserType } from "./queryUser";

type Apartment = Database["public"]["Tables"]["apartments"]["Row"];
type Package = Database["public"]["Tables"]["packages"]["Row"];
type Resident = Database["public"]["Tables"]["residents"]["Row"];

interface ApartmentWithDetails extends Apartment {
  residents: Resident[];
  packages: Package[];
  building: Database["public"]["Tables"]["buildings"]["Row"];
}

interface CreateApartmentData {
  building_id: string;
  number: string;
}

interface DeleteApartmentData {
  id: string;
}

interface UpdateApartmentData {
  id: string;
  number: string;
}

export function useApartmentManagement(buildingId: string | null) {
  const queryClient = useQueryClient();
  const userTypeQuery = useUserType();

  const query = useQuery({
    queryKey: ["apartments-with-details", buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const userType = await userTypeQuery.data;
      let query = supabase
        .from("apartments")
        .select(
          `
          *,
          building:buildings (*),
          residents:residents (*),
          packages:packages (*)
        `
        )
        .eq("building_id", buildingId)

        .order("number");

      if (userType?.type === "manager") {
        const { data: doormen, error: doormenError } = await supabase
          .from("doormen")
          .select("user_id")
          .eq("manager_id", userType.managerId);

        if (doormenError) {
          console.error("Error fetching doormen:", doormenError);
          return null;
        }

        const doormenIds = doormen.map((d) => d.user_id);
        doormenIds.push(userType.relatedId);
        console.log(doormenIds);

        query = query.in("user_id", doormenIds);
      } else {
        query = query.in("user_id", [
          userType?.relatedId,
          userType?.doormanUserId,
        ]);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as ApartmentWithDetails[];
    },
    enabled: !!buildingId && !!userTypeQuery.data,
  });

  const createApartment = useMutation({
    mutationFn: async (data: CreateApartmentData) => {
      const { error } = await supabase.from("apartments").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["apartments-with-details", buildingId],
      });
    },
  });

  const deleteApartment = useMutation({
    mutationFn: async ({ id }: DeleteApartmentData) => {
      const { error } = await supabase.from("apartments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["apartments-with-delete", buildingId],
      });
    },
  });

  const updateApartment = useMutation({
    mutationFn: async ({ id, ...data }: UpdateApartmentData) => {
      const { error } = await supabase
        .from("apartments")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["apartments-with-details", buildingId],
      });
    },
  });

  return {
    apartments: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createApartment,
    updateApartment,
    deleteApartment,
  };
}
