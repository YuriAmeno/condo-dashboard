import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/validations/auth";
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
import { useToast } from "@/hooks/use-toast";

export function ForgotPassword() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      const result = await resetPassword(data.email);

      if (result.error) {
        if (result.error.message.includes("User not found")) {
          toast({
            variant: "destructive",
            title: "Usuário não encontrado",
            description: "Não existe uma conta com este email.",
          });
        } else if (result.error.message.includes("Email rate limit exceeded")) {
          toast({
            variant: "destructive",
            title: "Muitas tentativas",
            description: "Aguarde alguns minutos antes de tentar novamente.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao enviar email",
            description: result.error.message,
          });
        }
        return;
      }

      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      navigate("/auth/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro inesperado",
        description: "Não foi possível enviar o email de recuperação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <p className="text-lg">
              Sistema de gestão de encomendas para condomínios.
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Esqueceu sua senha?
            </h1>
            <p className="text-sm text-muted-foreground">
              Digite seu email para receber um link de recuperação
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
                        disabled={isLoading}
                        {...field}
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
                    Enviando...
                  </>
                ) : (
                  "Enviar Email"
                )}
              </Button>
            </form>
          </Form>

          <Button
            variant="link"
            className="flex items-center justify-center"
            onClick={() => navigate("/auth/login")}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para o login
          </Button>
        </div>
      </div>
    </div>
  );
}
