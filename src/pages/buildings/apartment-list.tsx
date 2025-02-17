import { useApartmentManagement } from '@/hooks/use-apartment-management';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ApartmentForm } from './apartment-form';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Package, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApartmentListProps {
  buildingId: string;
}

export function ApartmentList({ buildingId }: ApartmentListProps) {
  const { apartments, isLoading, createApartment } = useApartmentManagement(buildingId);
  const { toast } = useToast();

  const handleCreateApartment = async (data: { number: string }) => {
    try {
      await createApartment.mutateAsync({
        ...data,
        building_id: buildingId,
      });
      toast({
        title: 'Apartamento criado',
        description: 'O apartamento foi criado com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar apartamento',
        description: 'Não foi possível criar o apartamento. Tente novamente.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Apartamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Apartamento</DialogTitle>
              <DialogDescription>
                Adicione um novo apartamento à torre.
              </DialogDescription>
            </DialogHeader>
            <ApartmentForm onSubmit={handleCreateApartment} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Moradores</TableHead>
              <TableHead>Encomendas Pendentes</TableHead>
              <TableHead>Última Entrega</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apartments?.map((apartment) => {
              const pendingPackages = apartment.packages?.filter(
                (p) => p.status === 'pending'
              );
              const lastPackage = apartment.packages
                ?.sort(
                  (a, b) =>
                    new Date(b.received_at).getTime() -
                    new Date(a.received_at).getTime()
                )
                .at(0);

              return (
                <TableRow key={apartment.id}>
                  <TableCell className="font-medium">
                    {apartment.number}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        apartment.residents?.length ? 'default' : 'secondary'
                      }
                    >
                      {apartment.residents?.length ? 'Ocupado' : 'Vago'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{apartment.residents?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{pendingPackages?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {lastPackage && (
                      <div className="text-sm text-muted-foreground">
                        {format(
                          new Date(lastPackage.received_at),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}