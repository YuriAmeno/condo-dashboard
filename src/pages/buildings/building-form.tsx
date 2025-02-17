import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Database } from "@/types/supabase";

const buildingSchema = z.object({
  name: z.string().min(1, "Nome da torre é obrigatório"),
});

type BuildingFormData = z.infer<typeof buildingSchema>;
type Building = Database["public"]["Tables"]["buildings"]["Row"];

interface BuildingFormProps {
  building?: Building;
  onSubmit: (data: BuildingFormData) => Promise<void>;
}

export function BuildingForm({ building, onSubmit }: BuildingFormProps) {
  const form = useForm<BuildingFormData>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      name: building?.name || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Torre</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Torre A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {building ? "Atualizar Torre" : "Criar Torre"}
        </Button>
      </form>
    </Form>
  );
}
