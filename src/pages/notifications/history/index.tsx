import { History, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotificationHistory } from '@/hooks/use-notification-history';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function NotificationHistory() {
  const { data: notifications = [], isLoading } = useNotificationHistory();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <History className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">
          Histórico de Notificações
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Notificações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>{notification.queue.template.title}</TableCell>
                    <TableCell>{notification.queue.template.type}</TableCell>
                    <TableCell>
                      {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          notification.status === 'delivered' ? 'default' :
                          notification.status === 'failed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {notification.status === 'delivered' ? 'Entregue' :
                         notification.status === 'failed' ? 'Falhou' :
                         notification.status === 'sent' ? 'Enviado' :
                         notification.status === 'pending' ? 'Pendente' :
                         'Em Processamento'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}