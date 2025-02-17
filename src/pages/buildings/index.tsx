import { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Package,
  Users,
  Home,
  Loader2,
  MoreHorizontal,
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ApartmentList } from "./apartment-list";
import { BuildingForm } from "./building-form";

export function Buildings() {
  const [search, setSearch] = useState("");
  const { buildings, isLoading, createBuilding, updateBuilding } =
    useBuildingManagement();
  const { toast } = useToast();

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
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar torre",
        description: "Não foi possível atualizar a torre. Tente novamente.",
      });
    }
  };

  console.log("FILTEDEBILDING", filteredBuildings);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Torres</h1>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
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
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar torres..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-[250px]"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBuildings?.map((building) => (
            <Card key={building.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{building.name}</CardTitle>
                  <CardDescription>
                    {building.total_apartments} apartamentos
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Dialog>
                      <DialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
                    <Sheet>
                      <SheetTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Home className="mr-2 h-4 w-4" />
                          Gerenciar Apartamentos
                        </DropdownMenuItem>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-[800px] sm:w-[800px]"
                      >
                        <SheetHeader>
                          <SheetTitle>
                            Apartamentos - {building.name}
                          </SheetTitle>
                          <SheetDescription>
                            Gerencie os apartamentos desta torre.
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <ApartmentList buildingId={building.id} />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid grid-cols-3 gap-4">
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
                    <div className="space-y-2">
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
