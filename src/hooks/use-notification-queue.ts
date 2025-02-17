import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { NotificationStatus } from '@/types/supabase';

type QueueItem = Database['public']['Tables']['notification_queue']['Row'] & {
  resident: Database['public']['Tables']['residents']['Row'];
  template: Database['public']['Tables']['notification_templates']['Row'];
  package: Database['public']['Tables']['packages']['Row'] | null;
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

  const query = useQuery({
    queryKey: ['notification-queue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_queue')
        .select(`
          *,
          resident:residents (
            name,
            phone,
            receive_notifications,
            notifications_paused_at,
            notifications_resume_at
          ),
          template:notification_templates (
            type,
            title,
            content
          ),
          package:packages (*)
        `)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as QueueItem[];
    },
  });

  const addToQueue = useMutation({
    mutationFn: async (data: CreateQueueItemData) => {
      const { error } = await supabase
        .from('notification_queue')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-queue'] });
    },
  });

  const updateQueueItem = useMutation({
    mutationFn: async ({ id, ...data }: UpdateQueueItemData) => {
      const { error } = await supabase
        .from('notification_queue')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-queue'] });
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