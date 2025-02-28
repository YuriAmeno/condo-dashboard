import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Package, User, Building2 } from 'lucide-react'
import { useEffect } from 'react'
import { useLayout } from '../core/useLayout'

interface PackagePeding {
  userLogged: any
}

export const PackagePending = ({ userLogged }: PackagePeding) => {
  const { toast } = useToast()
  const { setPacks, packs, packVerified } = useLayout()

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('packages')
        .select(
          `*,
        apartment:apartments!inner(
          *,
          building:buildings!inner(*)
        ), resident:residents!inner(*)`,
        )
        .in('apartment.building.user_id', [userLogged?.relatedId, userLogged?.doormanUserId])
        .eq('status', 'pending')

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao sair',
          description: 'Não foi possível fazer logout. Tente novamente.',
        })
      }

      setPacks(data)
    }
    fetchPackages()
  }, [])

  // Versão mobile (cards)
  const MobileView = () => (
    <div className="space-y-3 sm:hidden">
      {packs?.map((pack: any) => {
        const statusPack = packVerified.some((val: any) => val == pack.id)
        return (
          <div key={pack.id} className="bg-card rounded-lg border p-3 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <Badge variant={statusPack ? 'default' : 'destructive'} className="text-xs">
                {statusPack ? 'Verificado' : 'Pendente'}
              </Badge>
              <span className="text-xs text-muted-foreground">{pack?.delivery_company}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">{pack?.apartment?.building?.name}</span>
                <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full">
                  {pack?.apartment?.number}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{pack?.resident?.name}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  // Versão desktop (tabela)
  return (
    <>
      <MobileView />

      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Verificação</TableHead>
              <TableHead>Torre</TableHead>
              <TableHead>Apartamento</TableHead>
              <TableHead>Morador</TableHead>
              <TableHead>Empresa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packs?.map((pack: any) => {
              const statusPack = packVerified.some((val: any) => val == pack.id)
              return (
                <TableRow key={pack.id}>
                  <TableCell className="font-medium">
                    <Badge variant={statusPack ? 'default' : 'destructive'}>
                      {statusPack ? 'Verificado' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>{pack?.apartment?.building?.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{pack?.apartment?.number}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{pack?.resident?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{pack?.delivery_company}</span>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
