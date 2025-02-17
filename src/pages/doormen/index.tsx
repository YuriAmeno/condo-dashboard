import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Search,
  Package,
  Clock,
  MoreHorizontal,
  History,
  UserCog,
  BellRing,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDoormen } from "@/hooks/use-doormen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DoormanDetails } from "./doorman-details";

const statusMap = {
  active: { label: "Ativo", variant: "default" },
  vacation: { label: "Férias", variant: "secondary" },
  away: { label: "Afastado", variant: "secondary" },
  inactive: { label: "Inativo", variant: "destructive" },
} as const;

const shiftMap = {
  morning: { label: "Manhã" },
  afternoon: { label: "Tarde" },
  night: { label: "Noite" },
} as const;

export function Doormen() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shiftFilter, setShiftFilter] = useState<string>("all");

  const { doormen, isLoading } = useDoormen({
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    shift: shiftFilter === "all" ? undefined : (shiftFilter as any),
  });

  const filteredDoormen = doormen?.filter(
    (doorman) =>
      doorman.name.toLowerCase().includes(search.toLowerCase()) ||
      doorman.email.toLowerCase().includes(search.toLowerCase()) ||
      doorman.phone.includes(search)
  );

  // Função para formatar o tempo médio
  const formatAverageTime = (time: number | null) => {
    if (time === null || isNaN(time)) return "N/A";
    const seconds = Math.round(time / 1000);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Porteiros</h1>
        </div>

        <Button onClick={() => navigate("/doormen/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Porteiro
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar porteiros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[250px]"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="vacation">Em férias</SelectItem>
            <SelectItem value="away">Afastados</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={shiftFilter} onValueChange={setShiftFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por turno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os turnos</SelectItem>
            <SelectItem value="morning">Manhã</SelectItem>
            <SelectItem value="afternoon">Tarde</SelectItem>
            <SelectItem value="night">Noite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredDoormen?.map((doorman) => (
            <Card key={doorman.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle>{doorman.name}</CardTitle>
                  <CardDescription>
                    {shiftMap[doorman.shift].label}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate(`/doormen/${doorman.id}`)}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Editar Porteiro
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate(`/doormen/${doorman.id}/status`)}
                    >
                      <History className="mr-2 h-4 w-4" />
                      Alterar Status
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BellRing className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Status</span>
                      </div>
                      <Badge variant={statusMap[doorman.status].variant as any}>
                        {statusMap[doorman.status].label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Encomendas Hoje
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        {doorman.packages_today}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tempo Médio</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {formatAverageTime(doorman.average_time)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Cadastrado em{" "}
                        {format(
                          new Date(doorman.created_at),
                          "dd 'de' MMMM 'de' yyyy",
                          {
                            locale: ptBR,
                          }
                        )}
                      </p>
                    </div>

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline">Ver Detalhes</Button>
                      </SheetTrigger>
                      <SheetContent
                        side="right"
                        className="w-[800px] sm:w-[800px]"
                      >
                        <SheetHeader>
                          <SheetTitle>Detalhes do Porteiro</SheetTitle>
                          <SheetDescription>
                            Informações completas e métricas do porteiro.
                          </SheetDescription>
                        </SheetHeader>
                        <DoormanDetails doorman={doorman} />
                      </SheetContent>
                    </Sheet>
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
