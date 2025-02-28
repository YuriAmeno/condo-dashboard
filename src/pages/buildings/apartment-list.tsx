import { useApartmentManagement } from '@/hooks/use-apartment-management'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ApartmentForm } from './apartment-form'
import { useToast } from '@/hooks/use-toast'
import { Plus, Loader2, X, User, Package } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { User as UserLogin } from '@supabase/supabase-js'

interface ApartmentListProps {
  buildingId: string
}

export function ApartmentList({ buildingId }: ApartmentListProps) {
  const { apartments, isLoading, createApartment, deleteApartment } =
    useApartmentManagement(buildingId)
  const { toast } = useToast()
  const [user, setUser] = useState<UserLogin | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao buscar usuario',
          description: 'Não foi possível achar o usuario. Tente novamente.',
        })
      }

      if (data) setUser(data.user)
    }
    init()
  }, [])

  const handleCreateApartment = async (data: { number: string }) => {
    try {
      await createApartment.mutateAsync({
        ...data,
        building_id: buildingId,
      })
      toast({
        title: 'Apartamento criado',
        description: 'O apartamento foi criado com sucesso.',
      })
      window.location.reload()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar apartamento',
        description: 'Não foi possível criar o apartamento. Tente novamente.',
      })
    }
  }

  const handleDeleteApartment = async (id: string) => {
    try {
      await deleteApartment.mutateAsync({ id })
      toast({
        title: 'Apartamento Deletado',
        description: 'O apartamento foi deletado com sucesso.',
      })
      window.location.reload()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar apartamento',
        description: 'Não foi possível deletar o apartamento. Tente novamente.',
      })
    }
  }

  return (
    <div className="space-y-4 w-full max-w-[350px] xs:max-w-[450px] sm:max-w-[550px] md:max-w-[600px]">
      {/* Cabeçalho Responsivo */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="min-h-touch-target rounded-mobile">
              <Plus className="mr-2 h-4 w-4" />
              Novo Apartamento
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-24px)] max-w-[350px] p-3 xs:p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle>Novo Apartamento</DialogTitle>
              <DialogDescription className="flex items-start">
                Adicione um novo apartamento à torre.
              </DialogDescription>
            </DialogHeader>
            <ApartmentForm onSubmit={handleCreateApartment} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Listagem Responsiva */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Versão móvel - lista de cards */}
          <div className="block sm:hidden space-y-3">
            {apartments?.map((apartment) => {
              const pendingPackages = apartment.packages?.filter((p) => p.status === 'pending')
              const lastPackage = apartment.packages
                ?.sort(
                  (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
                )
                .at(0)

              return (
                <div key={apartment.id} className="bg-card border rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-lg">{apartment.number}</div>
                    <Badge
                      variant={apartment.residents?.length ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {apartment.residents?.length ? 'Ocupado' : 'Vago'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{apartment.residents?.length || 0} moradores</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{pendingPackages?.length || 0} encomendas</span>
                    </div>
                  </div>

                  {lastPackage && (
                    <div className="text-xs text-muted-foreground mb-3">
                      Última entrega:{' '}
                      {format(new Date(lastPackage.received_at), 'dd/MM/yy HH:mm', {
                        locale: ptBR,
                      })}
                    </div>
                  )}

                  {user?.user_metadata?.role !== 'doorman' && (
                    <div className="flex justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-touch-target h-9 w-9 p-0 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100%-24px)] max-w-[350px] p-3 xs:p-4">
                          <DialogHeader>
                            <DialogTitle>Deletar Apartamento</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja deletar este apartamento?
                            </DialogDescription>
                          </DialogHeader>
                          <Button
                            type="button"
                            className="w-full min-h-touch-target rounded-mobile mt-2"
                            onClick={() => handleDeleteApartment(apartment.id)}
                          >
                            Deletar Apartamento
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Versão desktop - tabela */}
          <div className="hidden sm:block overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Moradores</TableHead>
                  <TableHead>Encomendas</TableHead>
                  <TableHead>Última Entrega</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apartments?.map((apartment) => {
                  const pendingPackages = apartment.packages?.filter((p) => p.status === 'pending')
                  const lastPackage = apartment.packages
                    ?.sort(
                      (a, b) =>
                        new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
                    )
                    .at(0)

                  return (
                    <TableRow key={apartment.id}>
                      <TableCell className="font-medium">{apartment.number}</TableCell>
                      <TableCell>
                        <Badge variant={apartment.residents?.length ? 'default' : 'secondary'}>
                          {apartment.residents?.length ? 'Ocupado' : 'Vago'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{apartment.residents?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{pendingPackages?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lastPackage && (
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(lastPackage.received_at), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user?.user_metadata?.role !== 'doorman' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <X className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Deletar Apartamento</DialogTitle>
                                <DialogDescription>
                                  Tem certeza que deseja deletar este apartamento?
                                </DialogDescription>
                              </DialogHeader>
                              <Button
                                type="button"
                                className="w-full"
                                onClick={() => handleDeleteApartment(apartment.id)}
                              >
                                Deletar Apartamento
                              </Button>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
