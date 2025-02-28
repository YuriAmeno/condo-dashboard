import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { adminAuthClient, supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { DoormanShift } from '@/types/supabase'

import { useParams } from 'react-router-dom'
import { applyPhoneMaskRegister } from '@/lib/utils'

const shiftMap: Record<DoormanShift, { label: string }> = {
  morning: { label: 'Manhã (06:00 - 14:00)' },
  afternoon: { label: 'Tarde (14:00 - 22:00)' },
  night: { label: 'Noite (22:00 - 06:00)' },
}

const doormanSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
    shift: z.enum(['morning', 'afternoon', 'night'] as const),
    notes: z.string().optional(),
    password: z
      .string()
      .min(8, 'A senha deve ter no mínimo 8 caracteres')
      .regex(/[0-9]/, 'A senha deve conter pelo menos um número')
      .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
      .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'A senha deve conter pelo menos um caractere especial'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type DoormanFormData = z.infer<typeof doormanSchema>

const doormanEditSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone inválido').max(15, 'Telefone inválido'),
  shift: z.enum(['morning', 'afternoon', 'night'] as const),
  notes: z.string().optional(),
})

type DoormanEditFormData = z.infer<typeof doormanEditSchema>

export const DoormanForm = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)

  const { id } = useParams()

  const isEditing = !!id

  const form = useForm<DoormanFormData | DoormanEditFormData>({
    resolver: zodResolver(isEditing ? doormanEditSchema : doormanSchema),
    defaultValues: isEditing
      ? {
          name: '',
          cpf: '',
          email: '',
          phone: '',
          shift: 'morning',
          notes: '',
        }
      : {
          name: '',
          cpf: '',
          email: '',
          phone: '',
          shift: 'morning',
          notes: '',
          password: '',
          confirmPassword: '',
        },
  })

  useEffect(() => {
    if (isEditing) {
      const fetchDoorman = async () => {
        const { data, error } = await supabase.from('doormen').select('*').eq('id', id).single()
        if (error) {
          console.error('Erro ao buscar porteiro:', error)
          return
        }
        form.reset(data)
      }

      fetchDoorman()
    }
  }, [id, isEditing, form])

  const handleSubmitDoormen = async (data: DoormanFormData | DoormanEditFormData) => {
    try {
      setIsCreating(true)

      if (isEditing) {
        const updateData: DoormanEditFormData = data
        const { error } = await supabase
          .from('doormen')
          .update({
            name: updateData.name,
            cpf: updateData.cpf,
            email: updateData.email,
            phone: updateData.phone,
            shift: updateData.shift,
            notes: updateData.notes || null,
          })
          .eq('id', id)

        if (error) {
          toast({
            title: 'Erro ao atualizar porteiro',
            description: error.message,
          })
          throw new Error('Erro ao atualizar porteiro.')
        }

        toast({
          title: 'Porteiro Editado',
          description: 'O porteiro foi editado com sucesso.',
        })
        navigate('/doormen')
        window.location.reload()
      } else {
        const createData = data as DoormanFormData

        const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
          email: createData.email,
          password: createData?.password,
          email_confirm: true,
          user_metadata: { role: 'doorman', is_active: true },
        })

        if (authError) throw new Error(authError.message)
        if (!authData.user) throw new Error('Erro ao criar usuário.')

        const { data: manager, error: managerError } = await supabase
          .from('managers')
          .select('id, apartment_complex_id')
          .eq('user_id', user?.id)
          .single()

        if (managerError || !manager) {
          await adminAuthClient.auth.admin.deleteUser(authData.user.id)
          throw new Error('Manager não encontrado')
        }

        const { error: doormanError } = await supabase.from('doormen').insert({
          name: data.name,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          shift: data.shift,
          notes: data.notes || null,
          user_id: authData.user.id,
          manager_id: manager.id,
          apartment_complex_id: manager.apartment_complex_id,
          status: 'active',
        })

        if (doormanError) {
          await adminAuthClient.auth.admin.deleteUser(authData.user.id)
          throw new Error('Erro ao criar porteiro.')
        }

        toast({
          title: 'Porteiro cadastrado',
          description: 'O porteiro foi cadastrado com sucesso.',
        })
        navigate('/doormen')
        window.location.reload()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!user || user.role !== 'manager') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>Você não tem permissão para cadastrar porteiros.</AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard')}>Voltar para o Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Porteiro</h1>
        <p className="text-muted-foreground">Cadastre um novo porteiro no sistema.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmitDoormen)} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dados Pessoais</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do porteiro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
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
                          const masked = applyPhoneMaskRegister(e.target.value)
                          onChange(masked)
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
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Dados do Trabalho */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Dados do Trabalho</h2>

            <FormField
              control={form.control}
              name="shift"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turno de Trabalho</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o turno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(shiftMap).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais sobre o porteiro"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dados de Acesso */}

          {!isEditing && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Dados de Acesso</h2>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/doormen')}>
              Cancelar
            </Button>

            <Button type="submit" disabled={isCreating} className={isEditing ? 'hidden' : ''}>
              {isCreating ? 'Cadastrando...' : 'Cadastrar Porteiro'}
            </Button>

            <Button type="submit" disabled={isCreating} className={isEditing ? '' : 'hidden'}>
              {isCreating ? 'Editando...' : 'Editar Porteiro'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
