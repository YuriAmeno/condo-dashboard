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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DialogTrigger } from '@radix-ui/react-dialog'
import { useReactToPrint } from 'react-to-print'
import { PackageLabelList } from '@/components/packages/package-label-list'

export function PackageList() {
  const [search, setSearch] = useState('')
  const [buildingFilter, setBuildingFilter] = useState<string | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all')

  const { data: buildings } = useBuildingsList()
  const { data: packages, isLoading } = useRecentPackagesList(100)
  const labelRef = useRef<HTMLDivElement>(null)

  const filteredPackages = packages?.filter((pkg) => {
    const matchesSearch =
      pkg.apartment.building.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.delivery_company.toLowerCase().includes(search.toLowerCase()) ||
      pkg.store_name.toLowerCase().includes(search.toLowerCase())

    const matchesBuilding = buildingFilter === 'all' || pkg.apartment.building.id === buildingFilter
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter

    return matchesSearch && matchesBuilding && matchesStatus
  })

  const openDetail = (dtaPack: any) => {
    console.log(dtaPack)
  }

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
                        {format(new Date(pkg.received_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{pkg.doorman_name ? pkg.doorman_name : 'Síndico'}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Users className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">Etiqueta da Encomenda</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center">
                          <div ref={labelRef}>
                            <PackageLabelList data={pkg} />
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                          </DialogClose>
                          <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            Imprimir Etiqueta
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={() => openDetail(pkg)} />
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
