import { useApartmentManagement } from "@/hooks/use-apartment-management";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApartmentForm } from "./apartment-form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, X, User, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { User as UserLogin } from "@supabase/supabase-js";

interface ApartmentListProps {
  buildingId: string;
}

export function ApartmentList({ buildingId }: ApartmentListProps) {
  const { apartments, isLoading, createApartment, deleteApartment } =
    useApartmentManagement(buildingId);
  const { toast } = useToast();
  const [user, setUser] = useState<UserLogin | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao buscar usuario",
          description: "Não foi possível achar o usuario. Tente novamente.",
        });
      }

      if (data) setUser(data.user);
    };
    init();
  }, []);

  const handleCreateApartment = async (data: { number: string }) => {
    try {
      await createApartment.mutateAsync({
        ...data,
        building_id: buildingId,
      });
      toast({
        title: "Apartamento criado",
        description: "O apartamento foi criado com sucesso.",
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar apartamento",
        description: "Não foi possível criar o apartamento. Tente novamente.",
      });
    }
  };

  const handleDeleteApartment = async (id: string) => {
    try {
      await deleteApartment.mutateAsync({ id });
      toast({
        title: "Apartamento Deletado",
        description: "O apartamento foi deletado com sucesso.",
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar apartamento",
        description: "Não foi possível deletar o apartamento. Tente novamente.",
      });
    }
  };

  return (
    <div className="space-y-4 max-w-[400px]">
      {/* Cabeçalho Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Novo Apartamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Apartamento</DialogTitle>
              <DialogDescription className="flex items-start">
                Adicione um novo apartamento à torre.
              </DialogDescription>
            </DialogHeader>
            <ApartmentForm onSubmit={handleCreateApartment} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Listagem Responsiva */}
      {isLoading ? (
        <div className="flex items-center justify-center ">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] sm:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Moradores</TableHead>
                <TableHead>Encomendas</TableHead>
                <TableHead>Última Entrega</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apartments?.map((apartment) => {
                const pendingPackages = apartment.packages?.filter(
                  (p) => p.status === "pending"
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
                          apartment.residents?.length ? "default" : "secondary"
                        }
                      >
                        {apartment.residents?.length ? "Ocupado" : "Vago"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{apartment.residents?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                    <TableCell>
                      {user?.user_metadata?.role !== "doorman" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <X className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Deletar Apartamento</DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja deletar este apartamento?
                              </DialogDescription>
                            </DialogHeader>
                            <Button
                              type="button"
                              className="w-full"
                              onClick={() =>
                                handleDeleteApartment(apartment.id)
                              }
                            >
                              Deletar Apartamento
                            </Button>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
