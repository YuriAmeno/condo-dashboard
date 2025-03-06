import { useState } from 'react'
import {
  Users,
  Plus,
  Search,
  FileUp,
  FileDown,
  Building2,
  Package,
  Loader2,
  Edit,
  X,
} from 'lucide-react'
import { useResidents } from '@/hooks/use-residents'
import { useBuildingsList } from '@/hooks/use-buildings'
import { useImportExport } from '@/hooks/use-import-export'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useToast } from '@/hooks/use-toast'
import { ImportDialog } from './import-dialog'
import { ResidentForm } from './resident-form'
import { ResidentDetails } from './resident-details'
import { applyPhoneMask, formatPhoneForDB } from '@/lib/utils'
import type { Database } from '@/types/supabase'
import { ResidentFormEdit } from './resident-form-edit'

type Resident = Database['public']['Tables']['residents']['Row'] & {
  apartment: Database['public']['Tables']['apartments']['Row'] & {
    building: Database['public']['Tables']['buildings']['Row']
  }
  packages?: Array<Database['public']['Tables']['packages']['Row']>
}

export function Residents() {
  const [search, setSearch] = useState('')
  const [buildingFilter, setBuildingFilter] = useState<string | 'all'>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)

  const { residents, isLoading, updateResidents, deleteResident } = useResidents()
  const { data: buildings } = useBuildingsList()
  const { importData, exportData } = useImportExport()
  const { toast } = useToast()
  const { user } = useAuth()
  const isManager = user?.role === 'manager'

  const filteredResidents = residents?.filter((resident: Resident) => {
    const matchesSearch =
      resident.name.toLowerCase().includes(search.toLowerCase()) ||
      resident.apartment.number.toLowerCase().includes(search.toLowerCase()) ||
      resident.apartment.building.name.toLowerCase().includes(search.toLowerCase()) ||
      resident.phone.includes(search) ||
      resident.email.toLowerCase().includes(search.toLowerCase())

    const matchesBuilding =
      buildingFilter === 'all' || resident.apartment.building.id === buildingFilter

    return matchesSearch && matchesBuilding
  })

  const handleCreateResident = async (data: any) => {
    try {
      setIsCreating(true)

      const { data: existingResident } = await supabase
        .from('residents')
        .select('id')
        .eq('email', data.email)
        .single()

      if (existingResident) {
        toast({
          variant: 'destructive',
          title: 'Erro ao cadastrar morador',
          description: 'Já existe um morador cadastrado com este email.',
        })
        return
      }

      const { error } = await supabase.from('residents').insert({
        name: data.name,
        phone: formatPhoneForDB(data.phone),
        email: data.email,
        apartment_id: data.apartment_id,
        receive_notifications: data.receive_notifications,
      })

      if (error) {
        throw error
      }

      toast({
        title: 'Morador cadastrado',
        description: 'O morador foi cadastrado com sucesso.',
      })

      setIsCreating(false)
      window.location.reload()
    } catch (error) {
      console.error('Error creating resident:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar morador',
        description: 'Não foi possível cadastrar o morador. Tente novamente.',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditResident = async (id: string, data: any) => {
    try {
      const { building_id, ...filteredData } = data

      await updateResidents.mutateAsync({ id, ...filteredData })

      toast({
        title: 'Morador atualizado',
        description: 'O morador foi editado com sucesso.',
      })
      window.location.reload()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao editar morador',
        description: 'Não foi possível editar o morador. Tente novamente.',
      })
    }
  }

  const handleImport = async (file: File, mapping: Record<string, string>) => {
    try {
      await importData.mutateAsync({
        file,
        config: {
          type: 'residents',
          mapping,
        },
      })

      toast({
        title: 'Importação concluída',
        description: 'Os moradores foram importados com sucesso.',
      })

      setShowImportDialog(false)
      window.location.reload()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na importação',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível importar os moradores. Verifique o arquivo e tente novamente.',
      })
    }
  }

  const handleExport = async () => {
    try {
      const blob = await exportData.mutateAsync({
        type: 'residents',
        fields: ['name', 'phone', 'email', 'apartment_id'],
      })

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `moradores-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação concluída',
        description: 'Os dados foram exportados com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados. Tente novamente.',
      })
    }
  }

  const handleDeleteResident = async (id: string) => {
    try {
      await deleteResident.mutateAsync({ id })
      toast({
        title: 'Morador Deletado',
        description: 'O morador foi deletada com sucesso.',
      })
      window.location.reload()
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao deletar morador',
        description: 'Não foi possível deletar o morador. Tente novamente.',
      })
    }
  }

  return (
    <div className="container-responsive py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex-responsive items-center justify-between gap-4">
          <h1 className="text-heading">Moradores</h1>
          <div className="flex-responsive gap-2">
            {isManager && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="min-h-touch-target rounded-mobile">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Morador
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[calc(100%-24px)] max-w-[450px] p-3 xs:p-4 sm:p-5">
                    <DialogHeader>
                      <DialogTitle>Novo Morador</DialogTitle>
                      <DialogDescription>Adicione um novo morador ao condomínio.</DialogDescription>
                    </DialogHeader>
                    <ResidentForm
                      buildings={buildings || []}
                      onSubmit={handleCreateResident}
                      isCreating={isCreating}
                    />
                  </DialogContent>
                </Dialog>
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="min-h-touch-target rounded-mobile">
                      <FileUp className="mr-2 h-4 w-4" />
                      Importar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[calc(100%-24px)] max-w-[450px] p-3 xs:p-4 sm:p-5">
                    <ImportDialog
                      onCancel={() => setShowImportDialog(false)}
                      onImport={handleImport}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  className="min-h-touch-target rounded-mobile"
                  onClick={handleExport}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col xs:flex-row gap-4">
          <div className="relative w-full xs:w-auto flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar moradores..."
              className="w-full pl-8 min-h-touch-target rounded-mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full xs:w-60">
            <Select value={buildingFilter} onValueChange={(value) => setBuildingFilter(value)}>
              <SelectTrigger className="w-full min-h-touch-target rounded-mobile">
                <Building2 className="mr-2 h-4 w-4" />
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
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredResidents?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">Nenhum morador encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros ou adicione novos moradores.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <div className="block sm:hidden">
              <div className="divide-y">
                {filteredResidents?.map((resident) => (
                  <div key={resident.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{resident.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Building2 className="h-3.5 w-3.5 mr-1.5" />
                          {resident.apartment.building.name} - {resident.apartment.number}
                        </div>
                      </div>
                      <Badge variant={resident.receive_notifications ? 'default' : 'secondary'}>
                        {resident.receive_notifications ? 'Ativas' : 'Pausadas'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Telefone:</p>
                        <p>{applyPhoneMask(resident.phone)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email:</p>
                        <p className="truncate">{resident.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Encomendas:</p>
                        <div className="flex items-center">
                          <Package className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span>{resident.packages?.length || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button size="sm" className="flex-1 min-h-touch-target rounded-mobile">
                            <Users className="mr-2 h-4 w-4" />
                            Detalhes
                          </Button>
                        </SheetTrigger>
                        <SheetContent
                          side="right"
                          className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-4 sm:p-6"
                        >
                          <SheetHeader>
                            <SheetTitle>Detalhes do Morador</SheetTitle>
                            <SheetDescription>
                              Informações completas sobre o morador
                            </SheetDescription>
                          </SheetHeader>
                          <ResidentDetails resident={resident} />
                        </SheetContent>
                      </Sheet>

                      {isManager && (
                        <div className="flex gap-2 flex-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 min-h-touch-target rounded-mobile"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[calc(100%-24px)] max-w-[450px] p-3 xs:p-4 sm:p-5">
                              <DialogHeader>
                                <DialogTitle>Editar Morador</DialogTitle>
                                <DialogDescription>
                                  Editar informações do morador.
                                </DialogDescription>
                              </DialogHeader>
                              <ResidentFormEdit
                                resident={resident}
                                onSubmit={(data) => handleEditResident(resident.id, data)}
                              />
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="min-h-touch-target rounded-mobile h-9 w-9 flex-shrink-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[calc(100%-24px)] max-w-[350px] p-3 xs:p-4 sm:p-5">
                              <DialogHeader>
                                <DialogTitle>Deletar Morador</DialogTitle>
                                <DialogDescription>
                                  Tem certeza que deseja deletar o morador?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter className="mt-4">
                                <Button
                                  type="button"
                                  className="w-full min-h-touch-target rounded-mobile"
                                  onClick={() => handleDeleteResident(resident.id)}
                                >
                                  Deletar Morador
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden sm:block">
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
                            {resident.apartment.building.name} - {resident.apartment.number}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{applyPhoneMask(resident.phone)}</p>
                          <p className="text-sm text-muted-foreground">{resident.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={resident.receive_notifications ? 'default' : 'secondary'}>
                          {resident.receive_notifications ? 'Ativas' : 'Pausadas'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{resident.packages?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="ghost" size="sm" className="min-h-touch-target">
                                <Users className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent
                              side="right"
                              className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-4 sm:p-6"
                            >
                              <SheetHeader>
                                <SheetTitle>Detalhes do Morador</SheetTitle>
                                <SheetDescription>
                                  Informações completas sobre o morador
                                </SheetDescription>
                              </SheetHeader>
                              <ResidentDetails resident={resident} />
                            </SheetContent>
                          </Sheet>

                          {isManager && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="min-h-touch-target">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[calc(100%-24px)] max-w-[450px] p-3 xs:p-4 sm:p-5">
                                  <DialogHeader>
                                    <DialogTitle>Editar Morador</DialogTitle>
                                    <DialogDescription>
                                      Editar informações do morador.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <ResidentFormEdit
                                    resident={resident}
                                    onSubmit={(data) => handleEditResident(resident.id, data)}
                                  />
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="min-h-touch-target">
                                    <X className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[calc(100%-24px)] max-w-[350px] p-3 xs:p-4 sm:p-5">
                                  <DialogHeader>
                                    <DialogTitle>Deletar Morador</DialogTitle>
                                    <DialogDescription>
                                      Tem certeza que deseja deletar o morador?
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="mt-4">
                                    <Button
                                      type="button"
                                      className="w-full min-h-touch-target rounded-mobile"
                                      onClick={() => handleDeleteResident(resident.id)}
                                    >
                                      Deletar Morador
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
