import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as Icons from "lucide-react";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { usePackageAnalytics } from "@/hooks/use-package-analytics";
import { useRecentPackages } from "@/hooks/use-recent-packages";
import { useAlerts } from "@/hooks/use-alerts";
import { useBuildings } from "@/hooks/use-buildings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  PieChart,
  Pie,
  ChartTooltip,
} from "@/components/ui/chart";

export function Dashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("today");
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  const { data: metrics } = useDashboardMetrics();
  const { data: analytics } = usePackageAnalytics();
  const { data: recentPackages } = useRecentPackages();
  const { data: alerts } = useAlerts();
  const { data: buildings } = useBuildings();

  // Helper function to safely format dates
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return "";
      return formatDistanceToNow(date, { locale: ptBR, addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icons.Package className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedBuilding ?? ""}
            onValueChange={setSelectedBuilding}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o prédio" />
            </SelectTrigger>
            <SelectContent>
              {buildings?.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Icons.RefreshCw className="mr-2 h-4 w-4" />
            Atualização Automática
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total de Pacotes Pendentes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pacotes Pendentes
                </CardTitle>
                <Icons.Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.pendingPackages ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.deliveredToday ?? 0} entregues hoje
                </p>
              </CardContent>
            </Card>

            {/* Taxa de Ocupação do Armazenamento */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ocupação do Armazenamento
                </CardTitle>
                <Icons.Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.storageOccupation.toFixed(1)}%
                </div>
                <Progress
                  value={metrics?.storageOccupation ?? 0}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            {/* Pacotes Atrasados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pacotes Atrasados
                </CardTitle>
                <Icons.AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.delayedPackages ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando retirada há mais de 7 dias
                </p>
              </CardContent>
            </Card>

            {/* Tempo Médio de Retirada */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio de Retirada
                </CardTitle>
                <Icons.Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.averagePickupTime
                    ? `${Math.round(
                        metrics.averagePickupTime / (1000 * 60 * 60)
                      )}h`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Média dos últimos 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Pacotes Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Pacotes Recentes</CardTitle>
              <CardDescription>
                Lista dos últimos pacotes processados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tempo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPackages?.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell>{pkg.id}</TableCell>
                      <TableCell>
                        {pkg.delivery_company} - {pkg.store_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            pkg.status === "delivered" ? "default" : "secondary"
                          }
                        >
                          {pkg.status === "delivered" ? "Entregue" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(pkg.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/packages/list")}
              >
                Ver Todos os Pacotes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Pacotes</CardTitle>
                <CardDescription>Por tipo de entrega</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ height: 300 }}>
                  <PieChart>
                    <Pie
                      data={analytics?.statusStats ?? []}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    />
                    <ChartTooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
              <CardDescription>Lista de alertas ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts?.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Badge variant="default">{alert.type}</Badge>
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>
                          {format(
                            new Date(alert.createdAt),
                            "dd/MM/yyyy HH:mm",
                            {
                              locale: ptBR,
                            }
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Detalhes
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedAlert}
        onOpenChange={() => setSelectedAlert(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Alerta</DialogTitle>
            <DialogDescription>
              Informações detalhadas sobre o alerta selecionado.
            </DialogDescription>
          </DialogHeader>
          {selectedAlert && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Status</h4>
                <Badge variant="default">{selectedAlert.type}</Badge>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Descrição</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.message}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Data</h4>
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(selectedAlert.createdAt),
                    "dd/MM/yyyy 'às' HH:mm",
                    {
                      locale: ptBR,
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
