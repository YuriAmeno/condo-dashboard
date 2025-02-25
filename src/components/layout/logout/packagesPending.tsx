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
import { Package } from 'lucide-react'
import { useEffect } from 'react'
import { useLayout } from '../core/useLayout'

interface PackagePeding {
  userLogged: any
  //   handlePack: (pack: any) => void
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

  return (
    <Table className="min-w-[600px] sm:min-w-full">
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
                  <Package className="h-4 w-4 text-muted-foreground" />
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
  )
}
