import { useRef, useState } from 'react'
import { Package, Search, Building2, User, Clock, Loader2, Users, Printer } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useBuildingsList } from '@/hooks/use-buildings'
import { useRecentPackagesList } from '@/hooks/use-recent-packages'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DialogTrigger } from '@radix-ui/react-dialog'
import { useReactToPrint } from 'react-to-print'
import { PackageLabelList } from '@/components/packages/package-label-list'
import { useResidents } from '@/hooks/use-residents'

export function PackageList() {
  const [search, setSearch] = useState('')
  const [buildingFilter, setBuildingFilter] = useState<string | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all')
  const [selectedResident, setSelectedResident] = useState<string | 'all'>('all')
  const { data: buildings } = useBuildingsList()
  const { residents } = useResidents()
  const { data: packages, isLoading } = useRecentPackagesList(100)
  const labelRef = useRef<HTMLDivElement>(null)

  const filteredPackages = packages?.filter((pkg) => {
    const matchesSearch =
      pkg.apartment.building.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.delivery_company.toLowerCase().includes(search.toLowerCase()) ||
      pkg.store_name.toLowerCase().includes(search.toLowerCase()) ||
      pkg?.resident_id?.toLowerCase().includes(search.toLowerCase())

    const matchesBuilding = buildingFilter === 'all' || pkg.apartment.building.id === buildingFilter
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter
    const matchesResident = selectedResident === 'all' || pkg.resident_id === selectedResident
    return matchesSearch && matchesBuilding && matchesStatus && matchesResident
  })

  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
  })

  return (
    <div className="space-y-6 p-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Lista de Encomendas</h1>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar encomendas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full md:w-[250px]"
          />
        </div>

        <Select value={buildingFilter} onValueChange={(value) => setBuildingFilter(value)}>
          <SelectTrigger className="w-full md:w-[180px]">
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

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedResident}
          onValueChange={(value) => setSelectedResident(value as typeof selectedResident)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filtrar por morador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os moradores</SelectItem>
            {residents?.map((resident: any) => (
              <SelectItem key={resident.id} value={resident.id}>
                {resident.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loader ou Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        // Envolva a tabela para permitir scroll horizontal em telas pequenas
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Torre/Apartamento</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Recebimento</TableHead>
                <TableHead>Porteiro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPackages?.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell>
                    <Badge variant={pkg.status === 'delivered' ? 'default' : 'secondary'}>
                      {pkg.status === 'delivered' ? 'Entregue' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{pkg.apartment.building.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Não encontrado</span>
                    </div>
                  </TableCell>
                  <TableCell>{pkg.delivery_company}</TableCell>
                  <TableCell>{pkg.store_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(String(pkg.received_at)), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{pkg.doorman_name ? pkg.doorman_name : 'Síndico'}</TableCell>
                  <TableCell className="hidden xs:table-cell">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="min-h-touch-target w-10 h-10 sm:w-auto sm:h-auto rounded-mobile flex items-center justify-center"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[calc(100%-24px)] max-w-[350px] p-3 xs:p-4 sm:p-5">
                        <DialogHeader className="pb-0 space-y-1">
                          <DialogTitle className="text-center text-base">
                            {pkg.status === 'delivered'
                              ? 'Assinatura de Entrega'
                              : 'Etiqueta da Encomenda'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center">
                          {pkg.status === 'delivered' ? (
                            <div className="w-full">
                              {pkg.signature ? (
                                <div className="border rounded-md p-2 bg-muted/30">
                                  <img
                                    src={pkg.signature.signature_url}
                                    alt="Assinatura do Morador"
                                    className="w-full"
                                  />
                                  <p className="text-sm text-muted-foreground text-center mt-2">
                                    Assinatura do morador na entrega
                                  </p>
                                </div>
                              ) : (
                                <div className="text-center p-4 border rounded-md">
                                  <p className="text-muted-foreground">Assinatura não disponível</p>
                                </div>
                              )}
                              <div className="mt-3">
                                <p className="text-sm font-medium">Entregue em:</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(
                                    new Date(String(pkg.delivered_at)),
                                    "dd/MM/yyyy 'às' HH:mm",
                                    {
                                      locale: ptBR,
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div ref={labelRef} className="w-full">
                              <PackageLabelList data={pkg} />
                            </div>
                          )}
                        </div>
                        <DialogFooter className="mt-2 sm:mt-4 flex flex-col xs:flex-row gap-2">
                          <DialogClose asChild>
                            <Button
                              variant="outline"
                              className="w-full min-h-touch-target rounded-mobile text-sm"
                            >
                              Fechar
                            </Button>
                          </DialogClose>
                          {pkg.status !== 'delivered' && (
                            <Button
                              onClick={handlePrint}
                              className="w-full min-h-touch-target rounded-mobile text-sm"
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              Imprimir
                            </Button>
                          )}
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="xs:hidden">
                    <div className="flex items-center justify-end space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-touch-target w-10 h-10 rounded-mobile p-0 flex items-center justify-center"
                          >
                            <Users className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[calc(100%-24px)] max-w-[350px] p-3">
                          <DialogHeader className="pb-0 space-y-1">
                            <DialogTitle className="text-center text-base">
                              {pkg.status === 'delivered'
                                ? 'Assinatura de Entrega'
                                : 'Etiqueta da Encomenda'}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            {pkg.status === 'delivered' ? (
                              <div className="w-full">
                                {pkg.signature ? (
                                  <div className="border rounded-md p-2 bg-muted/30">
                                    <img
                                      src={pkg.signature.signature_url}
                                      alt="Assinatura do Morador"
                                      className="w-full"
                                    />
                                    <p className="text-sm text-muted-foreground text-center mt-2">
                                      Assinatura do morador na entrega
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center p-4 border rounded-md">
                                    <p className="text-muted-foreground">
                                      Assinatura não disponível
                                    </p>
                                  </div>
                                )}
                                <div className="mt-3">
                                  <p className="text-sm font-medium">Entregue em:</p>
                                  <p className="text-sm text-muted-foreground">
                                    {format(
                                      new Date(String(pkg.delivered_at)),
                                      "dd/MM/yyyy 'às' HH:mm",
                                      {
                                        locale: ptBR,
                                      },
                                    )}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div ref={labelRef} className="w-full">
                                <PackageLabelList data={pkg} />
                              </div>
                            )}
                          </div>
                          <DialogFooter className="mt-2 flex flex-col gap-2">
                            <DialogClose asChild>
                              <Button
                                variant="outline"
                                className="w-full min-h-touch-target rounded-mobile text-sm"
                              >
                                Fechar
                              </Button>
                            </DialogClose>
                            {pkg.status !== 'delivered' && (
                              <Button
                                onClick={handlePrint}
                                className="w-full min-h-touch-target rounded-mobile text-sm"
                              >
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
