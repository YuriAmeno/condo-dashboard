import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import type { NotificationTemplateType } from '@/types/supabase';

type Template = Database['public']['Tables']['notification_templates']['Row'];

interface CreateTemplateData {
  type: NotificationTemplateType;
  title: string;
  content: string;
  active?: boolean;
}

interface UpdateTemplateData extends Partial<CreateTemplateData> {
  id: string;
}

export function useNotificationTemplates() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .order('type');

      if (error) throw error;
      return data as Template[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (data: CreateTemplateData) => {
      const { error } = await supabase
        .from('notification_templates')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...data }: UpdateTemplateData) => {
      const { error } = await supabase
        .from('notification_templates')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('notification_templates')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
    },
  });

  return {
    templates: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createTemplate,
    updateTemplate,
    toggleTemplate,
  };
}