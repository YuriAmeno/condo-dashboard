import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, AlertTriangle } from 'lucide-react';
import { useDoormen } from '@/hooks/use-doormen';
import { useDoormanHistory } from '@/hooks/use-doorman-history';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { DoormanStatus } from '@/types/supabase';

const statusMap = {
  active: { label: 'Ativo', variant: 'default' },
  vacation: { label: 'Férias', variant: 'secondary' },
  away: { label: 'Afastado', variant: 'secondary' },
  inactive: { label: 'Inativo', variant: 'destructive' },
} as const;

export function DoormanStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { doormen, updateStatus } = useDoormen();
  const { data: history } = useDoormanHistory(id || null);

  const [showDialog, setShowDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<DoormanStatus>('active');
  const [reason, setReason] = useState('');

  const doorman = doormen?.find(d => d.id === id);

  if (!doorman) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Porteiro não encontrado</AlertTitle>
          <AlertDescription>
            Não foi possível encontrar o porteiro selecionado.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/doormen')}>Voltar</Button>
      </div>
    );
  }

  const handleUpdateStatus = async () => {
    try {
      await updateStatus.mutateAsync({
        id: doorman.id,
        status: newStatus,
        reason: reason || undefined,
      });

      toast({
        title: 'Status atualizado',
        description: 'O status do porteiro foi atualizado com sucesso.',
      });

      setShowDialog(false);
      setReason('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do porteiro.',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Status do Porteiro
        </h1>
        <p className="text-muted-foreground">
          Gerencie o status e histórico de {doorman.name}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Atual</CardTitle>
          <CardDescription>
            Informações sobre o status atual do porteiro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Status</p>
              <Badge
                variant={
                  statusMap[doorman.status].variant
                }
              >
                {statusMap[doorman.status].label}
              </Badge>
            </div>
            <Button onClick={() => setShowDialog(true)}>
              Alterar Status
            </Button>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Última Atualização</p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(doorman.updated_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Status</CardTitle>
          <CardDescription>
            Registro de todas as alterações de status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {history?.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between border-b pb-4 last:border-0"
              >
                <div className="space-y-1">
                  <Badge
                    variant={
                      statusMap[entry.status].variant
                    }
                  >
                    {statusMap[entry.status].label}
                  </Badge>
                  {entry.reason && (
                    <p className="text-sm text-muted-foreground">
                      {entry.reason}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(
                      new Date(entry.start_date),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
            <DialogDescription>
              Selecione o novo status e adicione uma justificativa se necessário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Novo Status</label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as DoormanStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusMap).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Justificativa</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explique o motivo da alteração..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setReason('');
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus}>
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}