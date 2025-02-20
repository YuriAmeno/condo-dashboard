import { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Package,
  Users,
  Home,
  Loader2,
  MoreHorizontal,
  Delete,
} from "lucide-react";
import { useBuildingManagement } from "@/hooks/use-building-management";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogContentBuilding,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { ApartmentList } from "./apartment-list";
import { BuildingForm } from "./building-form";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export function Buildings() {
  const [search, setSearch] = useState("");
  const {
    buildings,
    isLoading,
    createBuilding,
    updateBuilding,
    deleteBuilding,
  } = useBuildingManagement();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

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

  // Filtrar prédios baseado na busca
  const filteredBuildings = buildings?.filter((building) =>
    building.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateBuilding = async (data: { name: string }) => {
    try {
      await createBuilding.mutateAsync(data);
      toast({
        title: "Torre criada",
        description: "A torre foi criada com sucesso.",
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar torre",
        description: "Não foi possível criar a torre. Tente novamente.",
      });
    }
  };

  const handleUpdateBuilding = async (id: string, data: { name: string }) => {
    try {
      await updateBuilding.mutateAsync({ id, ...data });
      toast({
        title: "Torre atualizada",
        description: "A torre foi atualizada com sucesso.",
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar torre",
        description: "Não foi possível atualizar a torre. Tente novamente.",
      });
    }
  };

  const handleDeleteBuilding = async (id: string) => {
    try {
      await deleteBuilding.mutateAsync({ id });
      toast({
        title: "Torre Deletada",
        description: "A torre foi deletada com sucesso.",
      });
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao deletar torre",
        description: "Não foi possível deletar a torre. Tente novamente.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Responsivo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Torres
          </h1>
        </div>

        {user?.user_metadata.role !== "doorman" && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Torre
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Torre</DialogTitle>
                <DialogDescription>
                  Adicione uma nova torre ao condomínio.
                </DialogDescription>
              </DialogHeader>
              <BuildingForm onSubmit={handleCreateBuilding} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros Responsivos */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar torres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-[250px]"
          />
        </div>
      </div>

      {/* Lista de Torres Responsiva */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1">
          {filteredBuildings?.map((building) => (
            <Card key={building.id} className="w-full">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle>{building.name}</CardTitle>
                  <CardDescription>
                    {building.total_apartments} apartamentos
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.user_metadata?.role !== "doorman" && (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Editar Torre
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Editar Torre</DialogTitle>
                              <DialogDescription>
                                Altere as informações da torre.
                              </DialogDescription>
                            </DialogHeader>
                            <BuildingForm
                              building={building}
                              onSubmit={(data) =>
                                handleUpdateBuilding(building.id, data)
                              }
                            />
                          </DialogContent>
                        </Dialog>

                        <Dialog>
                          <DialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Delete className="mr-2 h-4 w-4" />
                              Deletar Torre
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Deletar Torre</DialogTitle>
                              <DialogDescription>
                                Tem certeza que deseja deletar a torre?
                              </DialogDescription>
                            </DialogHeader>
                            <Button
                              type="button"
                              className="w-full"
                              onClick={() => handleDeleteBuilding(building.id)}
                            >
                              Deletar Torre
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Home className="mr-2 h-4 w-4" />
                          Gerenciar Apartamentos
                        </DropdownMenuItem>
                      </DialogTrigger>
                      <DialogContentBuilding>
                        <DialogHeader>
                          <DialogTitle>
                            Apartamentos - {building.name}
                          </DialogTitle>
                          <DialogDescription>
                            Gerencie os apartamentos desta torre.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-6">
                          <ApartmentList buildingId={building.id} />
                        </div>
                      </DialogContentBuilding>
                    </Dialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Moradores</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {building.total_residents}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Encomendas Pendentes
                      </span>
                    </div>
                    <p className="text-2xl font-bold">
                      {building.pending_packages}
                    </p>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        Taxa de Ocupação
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {building.occupation_rate.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={building.occupation_rate} />
                    </div>
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
