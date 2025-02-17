import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, ShieldOff } from 'lucide-react';
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

export function Unauthorized() {
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
            <ShieldOff className="h-6 w-6 text-destructive" />
            <CardTitle>Acesso Negado</CardTitle>
          </div>
          <CardDescription>
            Você não tem permissão para acessar esta página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Permissão Insuficiente</AlertTitle>
            <AlertDescription>
              {user?.role === 'doorman'
                ? 'Esta funcionalidade é exclusiva para síndicos.'
                : 'Você não tem as permissões necessárias para acessar este recurso.'}
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>Possíveis motivos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Nível de acesso insuficiente</li>
              <li>Restrição de funcionalidade</li>
              <li>Área administrativa restrita</li>
              <li>Permissões não configuradas</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            disabled={isLoading}
          >
            Voltar para o Início
          </Button>
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
              'Sair do Sistema'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}