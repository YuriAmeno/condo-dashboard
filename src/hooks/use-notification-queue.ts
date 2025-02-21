import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import type { NotificationStatus } from "@/types/supabase";
import { useUserType } from "./queryUser";

type QueueItem = Database["public"]["Tables"]["notification_queue"]["Row"] & {
  resident: Database["public"]["Tables"]["residents"]["Row"];
  template: Database["public"]["Tables"]["notification_templates"]["Row"];
  package: Database["public"]["Tables"]["packages"]["Row"] | null;
};

interface CreateQueueItemData {
  resident_id: string;
  template_id: string;
  package_id?: string;
  scheduled_for: string;
}

interface UpdateQueueItemData {
  id: string;
  status: NotificationStatus;
  error?: string | null;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
}

export function useNotificationQueue() {
  const queryClient = useQueryClient();
  const userTypeQuery = useUserType();
  const query = useQuery({
    queryKey: ["notification-queue"],
    queryFn: async () => {
      const userType = userTypeQuery.data;
      let query = supabase
        .from("notification_queue")
        .select(
          `
          *,
          resident:residents (
            name,
            phone,
            receive_notifications,
            notifications_paused_at,
            notifications_resume_at,
            user_id
          ),
          template:notification_templates (
            type,
            title,
            content
          ),
          package:packages (*)
        `
        )
        .order("scheduled_for", { ascending: true });

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

        query = query.in("resident.user_id", doormenIds);
      } else {
        query = query.in("resident.user_id", [
          userType?.relatedId,
          userType?.doormanUserId,
        ]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as QueueItem[];
    },
  });

  const addToQueue = useMutation({
    mutationFn: async (data: CreateQueueItemData) => {
      const { error } = await supabase.from("notification_queue").insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-queue"] });
    },
  });

  const updateQueueItem = useMutation({
    mutationFn: async ({ id, ...data }: UpdateQueueItemData) => {
      const { error } = await supabase
        .from("notification_queue")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-queue"] });
    },
  });

  return {
    queue: query.data,
    isLoading: query.isLoading,
    error: query.error,
    addToQueue,
    updateQueueItem,
  };
}
