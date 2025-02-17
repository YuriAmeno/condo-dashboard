import { useState } from 'react';
import {
  Package,
  Search,
  Building2,
  User,
  Clock,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useBuildings } from '@/hooks/use-buildings';
import { useRecentPackages } from '@/hooks/use-recent-packages';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function PackageList() {
  const [search, setSearch] = useState('');
  const [buildingFilter, setBuildingFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'delivered'>('all');

  const { data: buildings } = useBuildings();
  const { data: packages, isLoading } = useRecentPackages(100); // Buscar mais pacotes para a lista

  // Filtrar pacotes
  const filteredPackages = packages?.filter((pkg) => {
    const matchesSearch = 
      pkg.apartment.building.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.apartment.number.toLowerCase().includes(search.toLowerCase()) ||
      pkg.delivery_company.toLowerCase().includes(search.toLowerCase()) ||
      pkg.store_name.toLowerCase().includes(search.toLowerCase());

    const matchesBuilding = buildingFilter === 'all' || pkg.apartment.building.id === buildingFilter;
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;

    return matchesSearch && matchesBuilding && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Lista de Encomendas
          </h1>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar encomendas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-[250px]"
          />
        </div>

        <Select
          value={buildingFilter}
          onValueChange={(value) => setBuildingFilter(value)}
        >
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="delivered">Entregues</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPackages?.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <Badge
                    variant={pkg.status === 'delivered' ? 'default' : 'secondary'}
                  >
                    {pkg.status === 'delivered' ? 'Entregue' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {pkg.apartment.building.name} - {pkg.apartment.number}
                    </span>
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
                <TableCell>{pkg.doorman_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}