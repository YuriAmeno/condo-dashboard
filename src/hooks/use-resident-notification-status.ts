import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface NotificationStatus {
  receive_notifications: boolean;
  notifications_paused_at: string | null;
  notifications_paused_by: string | null;
  notifications_resume_at: string | null;
}

interface UpdateNotificationStatusData {
  residentId: string;
  receive_notifications: boolean;
  notifications_paused_by?: string | null;
  notifications_paused_at?: string | null;
  notifications_resume_at?: string | null;
}

export function useResidentNotificationStatus(residentId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['resident-notification-status', residentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residents')
        .select('receive_notifications, notifications_paused_at, notifications_paused_by, notifications_resume_at')
        .eq('id', residentId)
        .single();

      if (error) throw error;
      return data as NotificationStatus;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (data: UpdateNotificationStatusData) => {
      const { error } = await supabase
        .from('residents')
        .update({
          receive_notifications: data.receive_notifications,
          notifications_paused_by: data.notifications_paused_by,
          notifications_paused_at: data.notifications_paused_at,
          notifications_resume_at: data.notifications_resume_at,
        })
        .eq('id', data.residentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['resident-notification-status', residentId],
      });
    },
  });

  return {
    status: query.data,
    isLoading: query.isLoading,
    error: query.error,
    updateStatus,
  };
}