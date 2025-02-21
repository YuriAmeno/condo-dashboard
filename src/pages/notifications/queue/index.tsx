import { MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNotificationQueue } from "@/hooks/use-notification-queue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { applyPhoneMask } from "@/lib/utils";

const statusMap = {
  pending: { label: "Pendente", variant: "secondary" },
  sending: { label: "Enviando", variant: "secondary" },
  sent: { label: "Enviado", variant: "default" },
  delivered: { label: "Entregue", variant: "default" },
  read: { label: "Lido", variant: "default" },
  failed: { label: "Falhou", variant: "destructive" },
} as const;

export function NotificationQueue() {
  const { queue, isLoading } = useNotificationQueue();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">
          Fila de Notificações
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensagens Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agendado para</TableHead>
                  <TableHead>Morador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atualização</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(
                        new Date(item.scheduled_for),
                        "dd/MM/yyyy 'às' HH:mm",
                        {
                          locale: ptBR,
                        }
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.resident?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {applyPhoneMask(item.resident?.phone)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{item.template.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusMap[item.status as keyof typeof statusMap]
                            .variant as any
                        }
                      >
                        {statusMap[item.status as keyof typeof statusMap].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(item.created_at),
                        "dd/MM/yyyy 'às' HH:mm",
                        {
                          locale: ptBR,
                        }
                      )}
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
