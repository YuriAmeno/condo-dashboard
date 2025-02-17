import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import type { Database } from '@/types/supabase';

const apartmentSchema = z.object({
  number: z.string().min(1, 'Número do apartamento é obrigatório'),
});

type ApartmentFormData = z.infer<typeof apartmentSchema>;
type Apartment = Database['public']['Tables']['apartments']['Row'];

interface ApartmentFormProps {
  apartment?: Apartment;
  onSubmit: (data: ApartmentFormData) => Promise<void>;
}

export function ApartmentForm({ apartment, onSubmit }: ApartmentFormProps) {
  const form = useForm<ApartmentFormData>({
    resolver: zodResolver(apartmentSchema),
    defaultValues: {
      number: apartment?.number || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Apartamento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 101" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {apartment ? 'Atualizar Apartamento' : 'Criar Apartamento'}
        </Button>
      </form>
    </Form>
  );
}