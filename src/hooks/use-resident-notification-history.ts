import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type NotificationLog = Database['public']['Tables']['notification_logs']['Row'] & {
  queue: {
    resident: Pick<Database['public']['Tables']['residents']['Row'], 'name' | 'phone'>;
    template: Pick<Database['public']['Tables']['notification_templates']['Row'], 'type' | 'title'>;
    package: Database['public']['Tables']['packages']['Row'] | null;
  };
};

export function useResidentNotificationHistory(residentId: string | null) {
  return useQuery({
    queryKey: ['resident-notification-history', residentId],
    queryFn: async () => {
      if (!residentId) return [];

      const { data, error } = await supabase
        .from('notification_logs')
        .select(`
          *,
          queue:notification_queue (
            resident:residents (
              name,
              phone
            ),
            template:notification_templates (
              type,
              title
            ),
            package:packages (*)
          )
        `)
        .eq('queue.resident_id', residentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NotificationLog[];
    },
    enabled: !!residentId,
  });
}