import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Package } from 'lucide-react';
import { useResidentNotificationHistory } from '@/hooks/use-resident-notification-history';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Database } from '@/types/supabase';

type Resident = Database['public']['Tables']['residents']['Row'];

interface NotificationHistoryProps {
  resident: Resident;
}

const statusMap = {
  pending: { label: 'Pendente', variant: 'secondary' },
  sending: { label: 'Enviando', variant: 'secondary' },
  sent: { label: 'Enviado', variant: 'default' },
  delivered: { label: 'Entregue', variant: 'default' },
  read: { label: 'Lido', variant: 'default' },
  failed: { label: 'Falhou', variant: 'destructive' },
} as const;

export function NotificationHistory({ resident }: NotificationHistoryProps) {
  const { data: history, isLoading } = useResidentNotificationHistory(resident.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!history?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] space-y-4">
        <Package className="h-12 w-12 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">Nenhuma notificação encontrada</p>
          <p className="text-sm text-muted-foreground">
            O histórico de notificações aparecerá aqui
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Encomenda</TableHead>
            <TableHead>Erro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>{log.queue.template.title}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    statusMap[log.status as keyof typeof statusMap]
                      .variant as any
                  }
                >
                  {statusMap[log.status as keyof typeof statusMap].label}
                </Badge>
              </TableCell>
              <TableCell>
                {log.queue.package && (
                  <div className="text-sm">
                    <p>{log.queue.package.delivery_company}</p>
                    <p className="text-muted-foreground">
                      {log.queue.package.store_name}
                    </p>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {log.error && (
                  <span className="text-sm text-destructive">
                    {log.error}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}