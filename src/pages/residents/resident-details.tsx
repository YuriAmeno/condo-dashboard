import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Package, Building2, Phone, Mail, BellRing, Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { Database } from '@/types/supabase'
import { applyPhoneMask } from '@/lib/utils'
import { useAuth } from '@/lib/auth'

type Resident = Database['public']['Tables']['residents']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row']
  }
  pending_packages?: number
  last_package?: Database['public']['Tables']['packages']['Row']
  packages?: any
}

interface ResidentDetailsProps {
  resident: Resident
}

export function ResidentDetails({ resident }: ResidentDetailsProps) {
  const { user } = useAuth()
  const residentPackageStts: { pending: 0; delivered: 0 } = resident.packages?.reduce(
    (acc: any, val: any) => {
      if (val.status === 'pending') acc.pending++
      if (val.status === 'delivered') acc.delivered++
      return acc
    },
    { pending: 0, delivered: 0 },
  )

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight">{resident.name}</h2>
        <p className="text-muted-foreground">
          Cadastrado em{' '}
          {format(new Date(resident.created_at), "dd 'de' MMMM 'de' yyyy", {
            locale: ptBR,
          })}
        </p>
      </div>

      <Separator />

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Localização</CardTitle>
            <CardDescription>Informações do apartamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>
                {resident.apartment.building.name} - Apto {resident.apartment.number}
              </span>
            </div>
          </CardContent>
        </Card>

        {user?.role === 'manager' && (
          <Card>
            <CardHeader>
              <CardTitle>Contatos</CardTitle>
              <CardDescription>Informações para contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{applyPhoneMask(resident.phone)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{resident.email}</span>
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
            <CardDescription>Status das notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BellRing className="h-4 w-4 text-muted-foreground" />
                <span>Status</span>
              </div>
              <Badge variant={resident.receive_notifications ? 'default' : 'secondary'}>
                {resident.receive_notifications ? 'Ativas' : 'Pausadas'}
              </Badge>
            </div>

            {!resident.receive_notifications && resident.notifications_paused_at && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Pausado em</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(resident.notifications_paused_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
                {resident.notifications_paused_by && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Pausado por: {resident.notifications_paused_by}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encomendas</CardTitle>
            <CardDescription>Status das entregas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Pendentes</span>
              </div>
              <span className="font-bold">{residentPackageStts?.pending}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Entregues</span>
              </div>
              <span className="font-bold">{residentPackageStts?.delivered}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
