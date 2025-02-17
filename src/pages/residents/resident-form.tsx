import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBuildings } from '@/hooks/use-buildings';
import { useApartments } from '@/hooks/use-apartments';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { applyPhoneMask } from '@/lib/utils';

const residentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  building_id: z.string().min(1, 'Torre é obrigatória'),
  apartment_id: z.string().min(1, 'Apartamento é obrigatório'),
  phone: z.string()
    .min(14, 'Telefone inválido')
    .max(15, 'Telefone inválido')
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido. Use (00) 00000-0000'),
  email: z.string().email('Email inválido'),
  receive_notifications: z.boolean().default(true),
});

type ResidentFormData = z.infer<typeof residentSchema>;

interface ResidentFormProps {
  onSubmit: (data: ResidentFormData) => Promise<void>;
}

export function ResidentForm({ onSubmit }: ResidentFormProps) {
  const form = useForm<ResidentFormData>({
    resolver: zodResolver(residentSchema),
    defaultValues: {
      name: '',
      building_id: '',
      apartment_id: '',
      phone: '',
      email: '',
      receive_notifications: true,
    },
  });

  const { data: buildings } = useBuildings();
  const { data: apartments } = useApartments(form.watch('building_id'));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do morador" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="building_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Torre</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    // Reset apartment when building changes
                    form.setValue('apartment_id', '');
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
                  onValueChange={field.onChange}
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
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field: { onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(00) 00000-0000"
                  {...field}
                  onChange={(e) => {
                    const masked = applyPhoneMask(e.target.value);
                    onChange(masked);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="receive_notifications"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  Receber Notificações
                </FormLabel>
                <div className="text-sm text-muted-foreground">
                  Ativar notificações de encomendas via WhatsApp
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Cadastrar Morador
        </Button>
      </form>
    </Form>
  );
}