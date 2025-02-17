import { NavLink } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const commonRoutes = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: Icons.LayoutDashboard,
  },
  {
    path: '/packages/register',
    label: 'Registrar Encomenda',
    icon: Icons.PackagePlus,
  },
  {
    path: '/packages/scan',
    label: 'Scanner QR Code',
    icon: Icons.QrCode,
  },
  {
    path: '/packages/list',
    label: 'Encomendas',
    icon: Icons.Package,
  },
  {
    path: '/buildings',
    label: 'Prédios',
    icon: Icons.Building2,
  },
  {
    path: '/residents',
    label: 'Moradores',
    icon: Icons.Users,
  },
];

const managerOnlyRoutes = [
  {
    path: '/doormen',
    label: 'Porteiros',
    icon: Icons.UserCog,
  },
];

const notificationRoutes = [
  {
    path: '/notifications/templates',
    label: 'Templates',
    icon: Icons.FileText,
    managerOnly: true,
  },
  {
    path: '/notifications/queue',
    label: 'Fila de Envio',
    icon: Icons.MessageSquare,
  },
  {
    path: '/residents/notifications',
    label: 'Controle por Morador',
    icon: Icons.BellRing,
  },
  {
    path: '/notifications/history',
    label: 'Histórico',
    icon: Icons.History,
  },
];

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';

  const handleClick = () => {
    // Ensure onNavigate is called after the navigation occurs
    setTimeout(() => onNavigate?.(), 0);
  };

  const renderNavLink = (route: typeof commonRoutes[0] & { managerOnly?: boolean }) => {
    if (route.managerOnly && !isManager) return null;

    return (
      <NavLink
        key={route.path}
        to={route.path}
        onClick={handleClick}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2',
            isActive 
              ? 'bg-accent text-accent-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          )
        }
      >
        <route.icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{route.label}</span>
      </NavLink>
    );
  };

  return (
    <div className={cn("border-r bg-background flex flex-col", className)}>
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          <div className="space-y-2">
            <h2 className="px-2 text-lg font-semibold tracking-tight">
              Geral
            </h2>
            <div className="space-y-1">
              {commonRoutes.map(renderNavLink)}
              {isManager && managerOnlyRoutes.map(renderNavLink)}
            </div>
          </div>

          <div className="space-y-2">
            <Separator className="my-4" />
            <h2 className="px-2 text-lg font-semibold tracking-tight">
              Notificações
            </h2>
            <div className="space-y-1">
              {notificationRoutes.map(renderNavLink)}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}