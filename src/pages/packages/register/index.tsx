import { useState, useRef, useEffect } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Package, Printer, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBuildingsList } from '@/hooks/use-buildings'
import { useApartments } from '@/hooks/use-apartments'
import { useResidents } from '@/hooks/use-residents'
import { useCreatePackage } from '@/hooks/use-create-package'
import { packageSchema, type PackageFormData } from '@/lib/validations/package'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { PackageLabel } from '@/components/packages/package-label'
import { getCompanies, getStores, packageSend } from '../core/_requests'
import type { Company } from '../core/_models'
import type { Store } from '../core/_models'
import { z } from 'zod'

export function PackageRegister() {
  const [showLabel, setShowLabel] = useState(false)
  const [createdPackage, setCreatedPackage] = useState<any>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const createPackage = useCreatePackage()

  const [companies, setCompanies] = useState<Company[]>([])
  const [stores, setStores] = useState<Store[]>([])

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      building_id: '',
      apartment_id: '',
      resident_id: '',
      delivery_company: '',
      store_name: '',
      notes: '',
      storage_location: '',
      custom_delivery_company: '',
    },
  })

  useEffect(() => {
    const othersOption = [{ id: 'others', name: 'Outros' }]
    getCompanies().then((companies) => {
      setCompanies([...companies, othersOption[0]])
    })
    getStores().then((stores) => {
      setStores([...stores, othersOption[0]])
    })
  }, [])

  const { data: buildings } = useBuildingsList()
  const { data: apartments } = useApartments(form.watch('building_id'))
  const { residents } = useResidents()

  const filteredResidents = residents?.filter(
    (resident: any) => resident.apartment.id === form.watch('apartment_id'),
  )

  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
  })

  const onSubmit = async (values: z.infer<typeof packageSchema>) => {
    const finalDeliveryCompany =
      values.delivery_company === 'Outros'
        ? values.custom_delivery_company
        : values.delivery_company

    const finalStoreName =
      values.store_name === 'Outros' ? values.custom_store_name : values.store_name

    try {
      values.delivery_company = String(finalDeliveryCompany)
      values.store_name = String(finalStoreName)
      const result = await createPackage.mutateAsync(values)
      setCreatedPackage(result)
      const dataSendWebHook = {
        delivery_company: String(finalDeliveryCompany),
        store_name: String(finalStoreName),
        resident_id: values.resident_id,
        package_id: String(result.id),
      }
      await packageSend(dataSendWebHook)
      setShowLabel(true)
      form.reset()
      toast({
        title: 'Encomenda registrada',
        description: 'A encomenda foi registrada com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar encomenda',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível registrar a encomenda. Tente novamente.',
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Registrar Encomenda</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Localização */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Localização</h2>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="building_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Torre</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Reset apartment and resident when building changes
                        form.setValue('apartment_id', '')
                        form.setValue('resident_id', '')
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma torre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buildings?.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apartment_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apartamento</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Reset resident when apartment changes
                        form.setValue('resident_id', '')
                      }}
                      value={field.value}
                      disabled={!form.watch('building_id')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um apartamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {apartments?.map((apartment) => (
                          <SelectItem key={apartment.id} value={apartment.id}>
                            {apartment.number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="resident_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Morador</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch('apartment_id')}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um morador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredResidents?.map((resident: any) => (
                          <SelectItem key={resident.id} value={resident.id}>
                            {resident.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Informações da Encomenda */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Informações da Encomenda</h2>

            <FormField
              control={form.control}
              name="delivery_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa de Entrega</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa de entrega" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.name}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('delivery_company') === 'others' && (
              <FormField
                control={form.control}
                name="custom_delivery_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="store_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loja</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma loja" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.name}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('store_name') === 'others' && (
              <FormField
                control={form.control}
                name="custom_store_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome da loja" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="storage_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de Armazenamento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Prateleira A3, Armário 2, etc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre a encomenda"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={createPackage.isPending}>
            {createPackage.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              'Registrar Encomenda'
            )}
          </Button>
        </form>
      </Form>

      <Dialog open={showLabel} onOpenChange={setShowLabel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Etiqueta da Encomenda</DialogTitle>
            <DialogDescription>
              A encomenda foi registrada com sucesso. Imprima a etiqueta para identificação.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center">
            <div ref={labelRef}>{createdPackage && <PackageLabel data={createdPackage} />}</div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLabel(false)}>
              Fechar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Etiqueta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
