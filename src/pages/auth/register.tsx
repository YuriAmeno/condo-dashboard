import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, Loader2 } from 'lucide-react'
import { supabase, adminAuthClient } from '@/lib/supabase'
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth'
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
import { useToast } from '@/hooks/use-toast'
import { applyPhoneMaskRegister, formatPhoneForDB } from '@/lib/utils'

export function Register() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      apartment_complex_name: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsCreating(true)

      // 1. Criar usuário no Supabase Auth com role 'manager'
      const { data: authData, error: authError } = await adminAuthClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'manager',
            is_active: true,
          },
          // emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      })

      if (authError) {
        if (authError.message.includes('already registered')) {
          toast({
            variant: 'destructive',
            title: 'Email já cadastrado',
            description: 'Este email já está sendo usado por outra conta.',
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro no cadastro',
            description: authError.message,
          })
        }
        return
      }

      if (!authData.user) {
        toast({
          variant: 'destructive',
          title: 'Erro no cadastro',
          description: 'Não foi possível criar o usuário.',
        })
        return
      }

      // 2. Verificar se o usuário está autenticado
      const { data: session } = await supabase.auth.getSession()

      if (!session.session) {
        // Se não estiver autenticado, fazer login com as credenciais fornecidas
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        })

        if (signInError) {
          toast({
            variant: 'destructive',
            title: 'Erro na autenticação',
            description: 'Não foi possível autenticar o usuário para completar o cadastro.',
          })

          // Limpar usuário criado em caso de erro
          await supabase.auth.admin.deleteUser(authData.user.id)
          return
        }
      }

      // 3. Criar complexo inicial
      const { data: complexData, error: complexError } = await supabase
        .from('apartment_complex')
        .insert({
          name: data.apartment_complex_name,
        })
        .select()
        .single()

      if (complexError) {
        console.error('Detailed complex error:', complexError)

        // Limpar usuário criado em caso de erro
        await supabase.auth.admin.deleteUser(authData.user.id)

        toast({
          variant: 'destructive',
          title: 'Erro ao criar condomínio',
          description: 'Não foi possível criar o condomínio. Tente novamente.',
        })
        return
      }

      if (!complexData) {
        // Limpar usuário criado em caso de erro
        await supabase.auth.admin.deleteUser(authData.user.id)

        toast({
          variant: 'destructive',
          title: 'Erro ao criar condomínio',
          description: 'Não foi possível criar o condomínio. Tente novamente.',
        })
        return
      }

      // 4. Criar registro do manager
      const { error: managerError } = await supabase.from('managers').insert({
        user_id: authData.user.id,
        name: data.name,
        email: data.email,
        phone: formatPhoneForDB(data.phone),
        apartment_complex_id: complexData.id,
      })

      if (managerError) {
        console.error('Detailed manager error:', managerError)

        // Limpar usuário e complexo criados em caso de erro
        await supabase.auth.admin.deleteUser(authData.user.id)
        await supabase.from('apartment_complex').delete().eq('id', complexData.id)

        toast({
          variant: 'destructive',
          title: 'Erro no cadastro',
          description: 'Não foi possível completar o cadastro do gerente. Tente novamente.',
        })
        return
      }

      // 5. Fazer logout para garantir que o usuário vá para a tela de login
      await adminAuthClient.auth.signOut()

      // Cadastro completo com sucesso
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: 'Você já pode fazer login no sistema.',
      })

      navigate('/auth/login')
    } catch (error) {
      console.error('Error creating manager:', error)
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Não foi possível completar o cadastro. Tente novamente.',
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-[#161d3d]" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Package className="mr-2 h-6 w-6" />
          Porta Dex
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">Sistema de gestão de encomendas para condomínios.</p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Criar Conta</h1>
            <p className="text-sm text-muted-foreground">Cadastre seu condomínio no sistema</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} disabled={isCreating} />
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
                        placeholder="seu@email.com"
                        {...field}
                        disabled={isCreating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        disabled={isCreating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apartment_complex_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Condomínio</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do seu condomínio"
                        {...field}
                        disabled={isCreating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isCreating}
                      />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        disabled={isCreating}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  'Cadastrar'
                )}
              </Button>
            </form>
          </Form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            Já tem uma conta?{' '}
            <Button
              variant="link"
              className="underline underline-offset-4 hover:text-primary"
              onClick={() => navigate('/auth/login')}
              disabled={isCreating}
            >
              Fazer login
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
