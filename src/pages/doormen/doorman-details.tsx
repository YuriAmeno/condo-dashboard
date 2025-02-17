import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Package,
  Timer,
  AlertTriangle,
  User,
  Mail,
  Phone,
  Calendar,
} from 'lucide-react';
import { useDoormanMetrics } from '@/hooks/use-doorman-metrics';
import { useDoormanHistory } from '@/hooks/use-doorman-history';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChartContainer, LineChart, Line, ChartTooltip } from '@/components/ui/chart';
import type { Database } from '@/types/supabase';

type Doorman = Database['public']['Tables']['doormen']['Row'] & {
  total_packages: number;
  packages_today: number;
  average_time: number;
  error_rate: number;
};

interface DoormanDetailsProps {
  doorman: Doorman;
}

const statusMap = {
  active: { label: 'Ativo', variant: 'default' },
  vacation: { label: 'Férias', variant: 'secondary' },
  away: { label: 'Afastado', variant: 'secondary' },
  inactive: { label: 'Inativo', variant: 'destructive' },
} as const;

const shiftMap = {
  morning: { label: 'Manhã' },
  afternoon: { label: 'Tarde' },
  night: { label: 'Noite' },
} as const;

export function DoormanDetails({ doorman }: DoormanDetailsProps) {
  const { data: metrics } = useDoormanMetrics(doorman.id);
  const { data: history } = useDoormanHistory(doorman.id);

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="mt-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {doorman.name}
          </h2>
          <div className="flex items-center space-x-2">
            <Badge
              variant={
                statusMap[doorman.status].variant
              }
            >
              {statusMap[doorman.status].label}
            </Badge>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {shiftMap[doorman.shift].label}
            </span>
          </div>
        </div>

        <Separator />

        {/* Contatos e Documentos */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">CPF: {doorman.cpf}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doorman.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doorman.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Cadastrado em{' '}
                  {format(new Date(doorman.created_at), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas do Dia</CardTitle>
              <CardDescription>
                Desempenho nas últimas 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Encomendas Registradas</span>
                </div>
                <span className="font-bold">{metrics?.packagesToday || 0}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Tempo Médio de Registro</span>
                </div>
                <span className="font-bold">
                  {metrics?.averageTime ? `${Math.round(metrics.averageTime / 1000)}s` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Taxa de Erros</span>
                </div>
                <span className="font-bold">
                  {metrics?.errorRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos e Estatísticas */}
        {metrics && (
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Volume de Registros</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ height: 300 }}>
                  <LineChart data={metrics.dailyStats}>
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#161d3d"
                      strokeWidth={2}
                    />
                    <ChartTooltip />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Status</CardTitle>
                <CardDescription>
                  Últimas alterações de status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history?.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <Badge
                          variant={
                            statusMap[entry.status].variant
                          }
                        >
                          {statusMap[entry.status].label}
                        </Badge>
                        {entry.reason && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {entry.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(
                          new Date(entry.start_date),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}