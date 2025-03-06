import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as Icons from 'lucide-react'
import { useDashboardMetrics } from '@/hooks/use-dashboard-metrics'
import { usePackageAnalytics } from '@/hooks/use-package-analytics'
import { useRecentPackages } from '@/hooks/use-recent-packages'
import { useAlerts } from '@/hooks/use-alerts'
import { useBuildings } from '@/hooks/use-buildings'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useTheme } from '@/components/theme-provider'
import { supabase } from '@/lib/supabase'

export function Dashboard() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('today')
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [timingMetric, setTiming] = useState<any>()
  const { data: metrics, refetch: refetchMetrics } = useDashboardMetrics(period, selectedBuilding)
  const { data: analytics, refetch: refetchAnalytics } = usePackageAnalytics(
    period,
    selectedBuilding,
  )
  const { data: recentPackages, refetch: refetchRecentPackages } = useRecentPackages(
    period,
    selectedBuilding,
  )
  const { data: alerts, refetch: refetchAlerts } = useAlerts(period, selectedBuilding)
  const { data: buildings, refetch: refetchBuildings } = useBuildings(period, selectedBuilding)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Classes de texto para o tema dark
  const textClass = isDark ? 'text-white' : 'text-gray-800'
  const mutedTextClass = isDark ? 'text-gray-300' : 'text-gray-500'
  const headingClass = isDark ? 'text-white' : 'text-gray-900'
  const descriptionClass = isDark ? 'text-gray-300' : 'text-gray-500'

  useEffect(() => {
    refetchMetrics()
    refetchAnalytics()
    refetchRecentPackages()
    refetchAlerts()
    refetchBuildings()
  }, [period, selectedBuilding])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return formatDistanceToNow(date, { locale: ptBR, addSuffix: true })
    } catch (error) {
      return ''
    }
  }

  const textMetric = () => {
    if (period == 'today') return 'Média de hoje'
    if (period == 'week') return 'Média dos últimos 7 dias'
    return 'Média dos últimos 30 dias'
  }

  useEffect(() => {
    if (metrics?.averagePickupTime) {
      const hours = Math.floor(metrics.averagePickupTime / (1000 * 60 * 60))
      const minutes = Math.floor((metrics.averagePickupTime % (1000 * 60 * 60)) / (1000 * 60))

      setTiming({ hour: hours, minute: minutes })
    } else {
      setTiming(null)
    }
  }, [metrics])

  // const handleLogout = () => {
  //   supabase.auth.signOut()
  //   navigate('/login')
  // }
  // handleLogout()
  return (
    <div className={`p-4 space-y-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
      {/* Header com título e filtros */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Icons.Package className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="flex flex-col md:flex-row items-stretch gap-4 w-full md:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedBuilding ?? ''} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-full md:w-[180px]">
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
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 overflow-x-auto">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pacotes Pendentes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={headingClass}>Pacotes Pendentes</CardTitle>
                <Icons.Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.pendingPackages ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.deliveredToday ?? 0} entregues hoje
                </p>
              </CardContent>
            </Card>

            {/* Ocupação do Armazenamento */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={headingClass}>Ocupação do Armazenamento</CardTitle>
                <Icons.Archive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.storageOccupation.toFixed(0)}%</div>
                <Progress value={metrics?.storageOccupation ?? 0} className="mt-2" />
              </CardContent>
            </Card>

            {/* Pacotes Atrasados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={headingClass}>Pacotes Atrasados</CardTitle>
                <Icons.AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.delayedPackages ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando retirada há mais de 7 dias
                </p>
              </CardContent>
            </Card>

            {/* Tempo Médio de Retirada */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className={headingClass}>Tempo Médio de Retirada</CardTitle>
                <Icons.Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timingMetric ? `${timingMetric.hour}h ${timingMetric.minute}m` : '0h 0m'}
                </div>
                <p className="text-xs text-muted-foreground">{textMetric()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Pacotes Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Pacotes Recentes</CardTitle>
              <CardDescription>Lista dos últimos pacotes processados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPackages?.length === 0 ? (
                <h1 className="text-center font-bold">Nenhum pacote encontrado</h1>
              ) : (
                <div className="overflow-x-auto">
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
                            <Badge variant={pkg.status === 'delivered' ? 'default' : 'secondary'}>
                              {pkg.status === 'delivered' ? 'Entregue' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(pkg.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/packages/list')}
              >
                Ver Todos os Pacotes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribuição de Pacotes */}
            <Card className={`w-full ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
              <CardHeader>
                <CardTitle className={headingClass}>Distribuição de Pacotes</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && analytics.statusStats?.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.statusStats.map((stat) => (
                      <div key={stat.status} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: stat.status === 'Pendente' ? '#FF8042' : '#00C49F',
                              }}
                            />
                            <span className={textClass}>{stat.status}</span>
                          </div>
                          <span className={textClass}>
                            {stat.count} ({stat.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={stat.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Volume de Pacotes por Edifício */}
            <Card className={`w-full ${isDark ? 'bg-gray-800 border-gray-700' : ''}`}>
              <CardHeader>
                <CardTitle className={headingClass}>Volume de Pacotes por Edifício</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && analytics.buildingStats?.length > 0 ? (
                  <div className="space-y-2">
                    {analytics.buildingStats.map((building) => (
                      <div key={building.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={textClass}>{building.name}</span>
                          <span className={textClass}>{building.total} pacotes</span>
                        </div>
                        <div className="flex h-2 items-center space-x-1 rounded-full bg-secondary">
                          <div
                            className="h-full rounded-l-full bg-primary"
                            style={{
                              width: `${(building.pending / building.total) * 100}%`,
                            }}
                          />
                          <div
                            className="h-full rounded-r-full bg-green-500"
                            style={{
                              width: `${(building.delivered / building.total) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className={mutedTextClass}>Pendentes: {building.pending}</span>
                          <span className={mutedTextClass}>Entregues: {building.delivered}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distribuição de Entregas por Período */}
          <Card className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 mt-5' : ''}`}>
            <CardHeader>
              <CardTitle className={headingClass}>Distribuição de Entregas por Período</CardTitle>
              <CardDescription className={descriptionClass}>
                Visualização de horários e dias com maior volume
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {analytics && analytics.deliveryHeatmap?.length > 0 ? (
                <div className="table-responsive">
                  {/* Visão para Mobile - Simplificada para telas muito pequenas */}
                  <div className="block sm:hidden">
                    <div className="space-y-4">
                      <p className="text-center text-sm text-muted-foreground mb-2">
                        Deslize para ver todos os dias da semana
                      </p>
                      <div className="overflow-x-auto pb-4">
                        <Table className="w-[600px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16 text-center font-medium">Hora</TableHead>
                              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                                <TableHead key={day} className="text-center font-medium w-14">
                                  {day}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'].map(
                              (hour) => (
                                <TableRow key={hour}>
                                  <TableCell className="text-center font-medium text-xs">
                                    {hour}
                                  </TableCell>
                                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => {
                                    const cell = analytics.deliveryHeatmap.find(
                                      (item) => item.hour === hour && item.day === day,
                                    )
                                    const count = cell?.count || 0
                                    const intensity = Math.min(1, count / 10)
                                    const bgColor = `rgba(24, 144, 255, ${intensity})`

                                    return (
                                      <TableCell
                                        key={`${hour}-${day}`}
                                        style={{
                                          backgroundColor: bgColor,
                                          color: isDark ? 'white' : 'black',
                                        }}
                                        className="text-center font-medium p-1 text-xs w-14 h-10 dark:text-white"
                                      >
                                        {count}
                                      </TableCell>
                                    )
                                  })}
                                </TableRow>
                              ),
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>

                  {/* Visão para Tablets e Desktop */}
                  <div className="hidden sm:block">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20 text-center">Horário/Dia</TableHead>
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                            <TableHead key={day} className="w-[calc((100%-80px)/7)] text-center">
                              {day}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {['6h', '8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'].map(
                          (hour) => (
                            <TableRow key={hour}>
                              <TableCell className="text-center font-medium">{hour}</TableCell>
                              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => {
                                const cell = analytics.deliveryHeatmap.find(
                                  (item) => item.hour === hour && item.day === day,
                                )
                                const count = cell?.count || 0
                                const intensity = Math.min(1, count / 10)
                                const bgColor = `rgba(24, 144, 255, ${intensity})`

                                return (
                                  <TableCell
                                    key={`${hour}-${day}`}
                                    style={{
                                      backgroundColor: bgColor,
                                      color: theme === 'dark' ? 'white' : 'black',
                                    }}
                                    className="text-center font-medium p-2 sm:p-3 text-sm dark:text-white"
                                  >
                                    {count}
                                  </TableCell>
                                )
                              })}
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500">Nenhum dado disponível</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
              <CardDescription>Lista de alertas ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
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
                            {format(new Date(alert.createdAt), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para detalhes do alerta */}
      <Dialog open={!!selectedAlert} onOpenChange={() => setSelectedAlert(null)}>
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
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Data</h4>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedAlert.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
