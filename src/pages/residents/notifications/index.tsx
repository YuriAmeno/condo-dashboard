import { useState } from 'react';
import {
  BellRing,
  Loader2,
  PauseCircle,
  PlayCircle,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useResidents } from '@/hooks/use-residents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase';

type Resident = Database['public']['Tables']['residents']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row'];
  };
};

export function ResidentNotifications() {
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const { residents, isLoading } = useResidents();
  const { toast } = useToast();

  const handleToggleNotifications = async (resident: Resident, enabled: boolean) => {
    if (!enabled) {
      setSelectedResident(resident);
      setShowPauseDialog(true);
      return;
    }

    try {
      // Implement notification toggle logic here
      toast({
        title: 'Notificações ativadas',
        description: 'As notificações foram ativadas com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao ativar notificações',
        description: 'Não foi possível ativar as notificações.',
      });
    }
  };

  const handlePauseNotifications = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedResident) return;

    try {
      // Implement pause notification logic here
      toast({
        title: 'Notificações pausadas',
        description: 'As notificações foram pausadas com sucesso.',
      });
      setShowPauseDialog(false);
      setSelectedResident(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao pausar notificações',
        description: 'Não foi possível pausar as notificações.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BellRing className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Controle de Notificações
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar moradores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[250px]"
          />
        </div>

        <Select value={buildingFilter} onValueChange={setBuildingFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por torre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as torres</SelectItem>
            {/* Add building options here */}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moradores</CardTitle>
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
                  <TableHead>Morador</TableHead>
                  <TableHead>Apartamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents?.filter((resident: Resident) => {
                  const matchesSearch = 
                    resident.name.toLowerCase().includes(search.toLowerCase()) ||
                    resident.apartment.number.toLowerCase().includes(search.toLowerCase()) ||
                    resident.apartment.building.name.toLowerCase().includes(search.toLowerCase());

                  const matchesBuilding = buildingFilter === 'all' || resident.apartment.building.id === buildingFilter;

                  return matchesSearch && matchesBuilding;
                }).map((resident: any) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">
                      {resident.name}
                    </TableCell>
                    <TableCell>
                      {resident.apartment.building.name} - {resident.apartment.number}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={resident.receive_notifications ? 'default' : 'secondary'}
                      >
                        {resident.receive_notifications ? 'Ativas' : 'Pausadas'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resident.notifications_paused_at && (
                        <span className="text-sm text-muted-foreground">
                          Pausado em{' '}
                          {format(
                            new Date(resident.notifications_paused_at),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={resident.receive_notifications}
                          onCheckedChange={(checked) =>
                            handleToggleNotifications(resident, checked)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleToggleNotifications(
                              resident,
                              !resident.receive_notifications
                            )
                          }
                        >
                          {resident.receive_notifications ? (
                            <PauseCircle className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pausar Notificações</DialogTitle>
            <DialogDescription>
              Informe o motivo para pausar as notificações do morador.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePauseNotifications} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Textarea
                name="reason"
                placeholder="Informe o motivo da pausa"
                className="resize-none"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPauseDialog(false);
                  setSelectedResident(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">Confirmar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}