import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BellRing, Clock, User } from 'lucide-react';
import { useResidentNotificationStatus } from '@/hooks/use-resident-notification-status';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { NotificationHistory } from './notification-history';
import type { Database } from '@/types/supabase';

type Resident = Database['public']['Tables']['residents']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
};

interface NotificationSettingsProps {
  resident: Resident;
}

export function NotificationSettings({ resident }: NotificationSettingsProps) {
  const { status, updateStatus } = useResidentNotificationStatus(resident.id);
  const { toast } = useToast();
  const [showHistory, setShowHistory] = useState(false);

  const handleToggleNotifications = async (checked: boolean) => {
    try {
      await updateStatus.mutateAsync({
        residentId: resident.id,
        receive_notifications: checked,
        notifications_paused_by: checked ? null : 'Portaria',
        notifications_paused_at: checked ? null : new Date().toISOString(),
        notifications_resume_at: null,
      });

      toast({
        title: checked ? 'Notificações ativadas' : 'Notificações pausadas',
        description: `As notificações foram ${checked ? 'ativadas' : 'pausadas'} com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao alterar notificações',
        description: 'Não foi possível alterar o status das notificações.',
      });
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">
          {resident.name}
        </h2>
        <p className="text-muted-foreground">
          {resident.apartment.building.name} - Apto {resident.apartment.number}
        </p>
      </div>

      <Separator />

      <div className="space-y-6">
        {/* Status atual */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Status das Notificações</h3>
          
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Receber Notificações</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {status?.receive_notifications
                  ? 'Notificações ativas via WhatsApp'
                  : 'Notificações pausadas temporariamente'}
              </div>
            </div>
            <Switch
              checked={status?.receive_notifications}
              onCheckedChange={handleToggleNotifications}
            />
          </div>

          {/* Informações adicionais quando pausado */}
          {!status?.receive_notifications && status?.notifications_paused_at && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Pausado em</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(status.notifications_paused_at),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )}
                </p>
              </div>

              {status.notifications_paused_by && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Pausado por</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {status.notifications_paused_by}
                  </p>
                </div>
              )}

              {status.notifications_resume_at && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Retorno automático</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      new Date(status.notifications_resume_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contatos */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contatos para Notificação</h3>
          
          <div className="rounded-lg border p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp</label>
              <p className="text-sm text-muted-foreground">{resident.phone}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <p className="text-sm text-muted-foreground">{resident.email}</p>
            </div>
          </div>
        </div>

        {/* Histórico de Notificações */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Histórico de Notificações</h3>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              Ver Histórico Completo
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Histórico de Notificações</DialogTitle>
            <DialogDescription>
              Histórico completo de notificações enviadas para {resident.name}
            </DialogDescription>
          </DialogHeader>
          <NotificationHistory resident={resident} />
        </DialogContent>
      </Dialog>
    </div>
  );
}