import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import type { Database } from "@/types/supabase";
import type { DoormanStatus, DoormanShift } from "@/types/supabase";

type Doorman = Database["public"]["Tables"]["doormen"]["Row"];

interface DoormanWithStats extends Doorman {
  total_packages: number;
  packages_today: number;
  average_time: number;
  error_rate: number;
}

interface CreateDoormanData {
  name: string;
  cpf: string;
  email: string;
  phone: string;
  shift: DoormanShift;
  photo_url?: string;
  documents?: Record<string, any>;
  notes?: string;
  user_id: string;
}

interface UpdateDoormanData extends Partial<CreateDoormanData> {
  id: string;
  status?: DoormanStatus;
}

interface UpdateStatusData {
  id: string;
  status: DoormanStatus;
  reason?: string;
  end_date?: string;
}

export function useDoormen(filters?: {
  status?: DoormanStatus;
  shift?: DoormanShift;
  search?: string;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["doormen", filters, user?.id],
    queryFn: async () => {
      // Buscar porteiros vinculados ao manager atual
      const { data: doormen, error: doormenError } = await supabase.from(
        "doormen"
      ).select(`
          *
        `);

      if (doormenError) throw doormenError;

      // Aplicar filtros
      let filteredDoormen = doormen.map((doorman) => {
        const packages = (doorman.packages as any[]) || [];
        const today = new Date().toISOString().split("T")[0];

        // Calcular métricas
        const total_packages = packages.length;
        const packages_today = packages.filter((p) =>
          p.received_at.startsWith(today)
        ).length;

        // Tempo médio de registro
        const registrationTimes = packages.map((p) => {
          const received = new Date(p.received_at);
          const created = new Date(p.created_at);
          return received.getTime() - created.getTime();
        });

        const average_time =
          registrationTimes.length > 0
            ? registrationTimes.reduce((a, b) => a + b, 0) /
              registrationTimes.length
            : 0;

        // Taxa de erros (pacotes com correções/total)
        const error_rate =
          packages.length > 0
            ? (packages.filter((p) => p.corrections?.length > 0).length /
                packages.length) *
              100
            : 0;

        return {
          ...doorman,
          total_packages,
          packages_today,
          average_time,
          error_rate,
        };
      });

      // Aplicar filtros
      if (filters?.status) {
        filteredDoormen = filteredDoormen.filter(
          (d) => d.status === filters.status
        );
      }

      if (filters?.shift) {
        filteredDoormen = filteredDoormen.filter(
          (d) => d.shift === filters.shift
        );
      }

      if (filters?.search) {
        const search = filters.search.toLowerCase();
        filteredDoormen = filteredDoormen.filter(
          (d) =>
            d.name.toLowerCase().includes(search) ||
            d.cpf.includes(search) ||
            d.email.toLowerCase().includes(search)
        );
      }

      return filteredDoormen as DoormanWithStats[];
    },
    enabled: !!user && user.role === "manager",
  });

  const createDoorman = useMutation({
    mutationFn: async (data: CreateDoormanData) => {
      // Primeiro verificar se o manager existe
      const { data: manager, error: managerError } = await supabase
        .from("managers")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (managerError || !manager) {
        throw new Error("Manager não encontrado");
      }

      // Criar o porteiro vinculado ao manager atual
      const { error } = await supabase.from("doormen").insert({
        ...data,
        status: "active",
        manager_id: manager.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doormen"] });
    },
  });

  const updateDoorman = useMutation({
    mutationFn: async ({ id, ...data }: UpdateDoormanData) => {
      const { error } = await supabase
        .from("doormen")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doormen"] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, reason, end_date }: UpdateStatusData) => {
      const { error: updateError } = await supabase
        .from("doormen")
        .update({ status })
        .eq("id", id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from("doormen_history")
        .insert({
          doorman_id: id,
          status,
          start_date: new Date().toISOString(),
          end_date,
          reason,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doormen"] });
    },
  });

  return {
    doormen: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createDoorman,
    updateDoorman,
    updateStatus,
  };
}
