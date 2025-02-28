import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Package, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
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

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      const result = await signIn(data.email, data.password)

      if (result.error) {
        // Tratamento específico para diferentes tipos de erro
        if (result.error.message.includes('Invalid login credentials')) {
          toast({
            variant: 'destructive',
            title: 'Credenciais inválidas',
            description: 'Email ou senha incorretos.',
          })
        } else if (result.error.message.includes('Email not confirmed')) {
          toast({
            variant: 'destructive',
            title: 'Email não confirmado',
            description: 'Por favor, confirme seu email antes de fazer login.',
          })
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro ao fazer login',
            description: result.error.message,
          })
        }
        return
      }

      // Redirecionar para a página anterior ou dashboard
      const from = (location.state as any)?.from || '/'
      navigate(from, { replace: true })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao tentar fazer login.',
      })
    } finally {
      setIsLoading(false)
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
            <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/auth/register')}
              disabled={isLoading}
            >
              Cadastrar Novo Condomínio
            </Button>
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            <Button
              variant="link"
              className="underline underline-offset-4 hover:text-primary"
              onClick={() => navigate('/auth/forgot-password')}
              disabled={isLoading}
            >
              Esqueceu sua senha?
            </Button>
          </p>
        </div>
      </div>
    </div>
  )
}
