import { FileText, Loader2 } from 'lucide-react';
import { useNotificationTemplates } from '@/hooks/use-notification-templates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NotificationTemplateType } from '@/types/supabase';

const templateTypes: Record<NotificationTemplateType, { label: string }> = {
  package_arrival: { label: 'Chegada de Encomenda' },
  followup_24h: { label: 'Lembrete 24h' },
  followup_48h: { label: 'Lembrete 48h' },
  followup_72h: { label: 'Lembrete 72h' },
  followup_7d: { label: 'Lembrete 7 dias' },
  package_pickup: { label: 'Confirmação de Retirada' },
};

export function NotificationTemplates() {
  const { templates, isLoading } = useNotificationTemplates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Templates de Mensagem
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {templates?.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{template.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium">Tipo:</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {templateTypes[template.type].label}
                    </span>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Conteúdo:</span>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {template.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}