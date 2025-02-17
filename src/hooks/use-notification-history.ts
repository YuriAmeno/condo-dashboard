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

interface NotificationHistoryFilters {
  residentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export function useNotificationHistory(filters?: NotificationHistoryFilters) {
  return useQuery({
    queryKey: ['notification-history', filters],
    queryFn: async () => {
      let query = supabase
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
        .order('created_at', { ascending: false });

      if (filters?.residentId) {
        query = query.eq('queue.resident_id', filters.residentId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as NotificationLog[];
    },
  });
}