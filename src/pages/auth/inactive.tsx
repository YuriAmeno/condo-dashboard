import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export function Inactive() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const result = await signOut();

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao sair',
          description: 'Não foi possível fazer logout. Tente novamente.',
        });
        return;
      }

      navigate('/auth/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao tentar sair do sistema.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>Conta Inativa</CardTitle>
          </div>
          <CardDescription>
            Sua conta está temporariamente inativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acesso Bloqueado</AlertTitle>
            <AlertDescription>
              {user?.role === 'doorman'
                ? 'Seu acesso ao sistema foi suspenso. Entre em contato com o síndico para mais informações.'
                : 'Seu acesso ao sistema foi suspenso. Entre em contato com o suporte para mais informações.'}
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>Possíveis motivos para inativação:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Afastamento temporário</li>
              <li>Férias</li>
              <li>Suspensão</li>
              <li>Desligamento</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="destructive"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saindo...
              </>
            ) : (
              'Voltar para o Login'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}