import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  FileUp,
  FileDown,
  Building2,
  Package,
  BellRing,
  Loader2,
} from "lucide-react";
import { useResidents } from "@/hooks/use-residents";
import { useBuildings } from "@/hooks/use-buildings";
import { useImportExport } from "@/hooks/use-import-export";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ImportDialog } from "./import-dialog";
import { ResidentForm } from "./resident-form";
import { NotificationSettings } from "./notification-settings";
import { ResidentDetails } from "./resident-details";
import { formatPhoneForDB } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type Resident = Database["public"]["Tables"]["residents"]["Row"] & {
  apartment: Database["public"]["Tables"]["apartments"]["Row"] & {
    building: Database["public"]["Tables"]["buildings"]["Row"];
  };
  packages?: Array<Database["public"]["Tables"]["packages"]["Row"]>;
};

export function Residents() {
  const [search, setSearch] = useState("");
  const [buildingFilter, setBuildingFilter] = useState<string | "all">("all");
  const [isCreating, setIsCreating] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const { data: residents, isLoading } = useResidents();
  const { data: buildings } = useBuildings();
  const { importData, exportData } = useImportExport();
  const { toast } = useToast();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const filteredResidents = residents?.filter((resident: Resident) => {
    const matchesSearch =
      resident.name.toLowerCase().includes(search.toLowerCase()) ||
      resident.apartment.number.toLowerCase().includes(search.toLowerCase()) ||
      resident.apartment.building.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      resident.phone.includes(search) ||
      resident.email.toLowerCase().includes(search.toLowerCase());

    const matchesBuilding =
      buildingFilter === "all" ||
      resident.apartment.building.id === buildingFilter;

    return matchesSearch && matchesBuilding;
  });

  const handleCreateResident = async (data: any) => {
    try {
      setIsCreating(true);

      const { data: existingResident } = await supabase
        .from("residents")
        .select("id")
        .eq("email", data.email)
        .single();

      if (existingResident) {
        toast({
          variant: "destructive",
          title: "Erro ao cadastrar morador",
          description: "Já existe um morador cadastrado com este email.",
        });
        return;
      }

      const { error } = await supabase.from("residents").insert({
        name: data.name,
        phone: formatPhoneForDB(data.phone),
        email: data.email,
        apartment_id: data.apartment_id,
        receive_notifications: data.receive_notifications,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Morador cadastrado",
        description: "O morador foi cadastrado com sucesso.",
      });

      setIsCreating(false);
    } catch (error) {
      console.error("Error creating resident:", error);
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar morador",
        description: "Não foi possível cadastrar o morador. Tente novamente.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleImport = async (file: File, mapping: Record<string, string>) => {
    try {
      await importData.mutateAsync({
        file,
        config: {
          type: "residents",
          mapping,
        },
      });

      toast({
        title: "Importação concluída",
        description: "Os moradores foram importados com sucesso.",
      });

      setShowImportDialog(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível importar os moradores. Verifique o arquivo e tente novamente.",
      });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportData.mutateAsync({
        type: "residents",
        fields: ["name", "phone", "email", "apartment_id"],
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `moradores-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Moradores</h1>
        </div>

        {isManager && (
          <div className="flex items-center gap-4">
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileUp className="mr-2 h-4 w-4" />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar Moradores</DialogTitle>
                  <DialogDescription>
                    Importe uma lista de moradores a partir de um arquivo Excel.
                  </DialogDescription>
                </DialogHeader>
                <ImportDialog onImport={handleImport} />
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Morador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Morador</DialogTitle>
                  <DialogDescription>
                    Cadastre um novo morador no sistema.
                  </DialogDescription>
                </DialogHeader>
                <ResidentForm onSubmit={handleCreateResident} />
              </DialogContent>
            </Dialog>
          </div>
        )}
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

        <Select
          value={buildingFilter}
          onValueChange={(value) =>
            setBuildingFilter(value as typeof buildingFilter)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por torre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as torres</SelectItem>
            {buildings?.map((building) => (
              <SelectItem key={building.id} value={building.id}>
                {building.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Apartamento</TableHead>
              <TableHead>Contatos</TableHead>
              <TableHead>Notificações</TableHead>
              <TableHead>Encomendas</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResidents?.map((resident) => (
              <TableRow key={resident.id}>
                <TableCell className="font-medium">{resident.name}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {resident.apartment.building.name} -{" "}
                      {resident.apartment.number}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm">{resident.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {resident.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      resident.receive_notifications ? "default" : "secondary"
                    }
                  >
                    {resident.receive_notifications ? "Ativas" : "Pausadas"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {resident.packages?.filter((p) => p.status === "pending")
                        .length || 0}{" "}
                      pendentes
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Users className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-[800px] sm:w-[800px]"
                      >
                        <SheetHeader>
                          <SheetTitle>Detalhes do Morador</SheetTitle>
                          <SheetDescription>
                            Informações completas do morador.
                          </SheetDescription>
                        </SheetHeader>
                        <ResidentDetails resident={resident} />
                      </SheetContent>
                    </Sheet>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <BellRing className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-[800px] sm:w-[800px]"
                      >
                        <SheetHeader>
                          <SheetTitle>Notificações</SheetTitle>
                          <SheetDescription>
                            Gerenciar notificações do morador.
                          </SheetDescription>
                        </SheetHeader>
                        <NotificationSettings resident={resident} />
                      </SheetContent>
                    </Sheet>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
