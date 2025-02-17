import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('manager' | 'doorman')[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, loading, checkPermissions } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      // Se não houver usuário, redirecionar para login
      if (!user) {
        navigate('/auth/login', {
          state: { from: location.pathname },
          replace: true,
        });
        return;
      }

      // Verificar se o usuário está ativo
      if (!user.is_active) {
        navigate('/auth/inactive', { replace: true });
        return;
      }

      // Verificar permissões se houver roles definidas
      if (allowedRoles && !checkPermissions(allowedRoles)) {
        navigate('/auth/unauthorized', { replace: true });
        return;
      }
    }
  }, [user, loading, navigate, location, allowedRoles, checkPermissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Não renderizar nada se não houver usuário ou não estiver ativo
  if (!user || !user.is_active) {
    return null;
  }

  // Não renderizar se não tiver permissão
  if (allowedRoles && !checkPermissions(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}