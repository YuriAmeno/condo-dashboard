// Chaves de query centralizadas para melhor manutenção
export const queryKeys = {
  // Autenticação
  auth: {
    session: ['auth', 'session'],
    user: ['auth', 'user'],
  },
  
  // Prédios
  buildings: {
    all: ['buildings'],
    detail: (id: string) => ['buildings', id],
    stats: ['buildings', 'stats'],
  },
  
  // Apartamentos
  apartments: {
    all: ['apartments'],
    byBuilding: (buildingId: string) => ['apartments', { buildingId }],
    detail: (id: string) => ['apartments', id],
  },
  
  // Moradores
  residents: {
    all: ['residents'],
    detail: (id: string) => ['residents', id],
    byApartment: (apartmentId: string) => ['residents', { apartmentId }],
    notifications: (id: string) => ['residents', id, 'notifications'],
  },
  
  // Porteiros
  doormen: {
    all: ['doormen'],
    detail: (id: string) => ['doormen', id],
    metrics: (id: string) => ['doormen', id, 'metrics'],
    history: (id: string) => ['doormen', id, 'history'],
  },
  
  // Encomendas
  packages: {
    all: ['packages'],
    detail: (id: string) => ['packages', id],
    byQR: (qrCode: string) => ['packages', { qrCode }],
    pending: ['packages', 'pending'],
    delivered: ['packages', 'delivered'],
    recent: ['packages', 'recent'],
    analytics: ['packages', 'analytics'],
  },
  
  // Notificações
  notifications: {
    templates: ['notifications', 'templates'],
    queue: ['notifications', 'queue'],
    history: ['notifications', 'history'],
  },
  
  // Dashboard
  dashboard: {
    metrics: ['dashboard', 'metrics'],
    alerts: ['dashboard', 'alerts'],
  },
};

// Função auxiliar para invalidar queries relacionadas
export function getInvalidateQueries(queryClient: any) {
  return {
    // Invalidar todas as queries de um recurso
    invalidateResource: (resource: keyof typeof queryKeys) => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
    
    // Invalidar queries específicas
    invalidateQueries: (keys: string[]) => {
      keys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    },
    
    // Invalidar e resetar cache
    resetQueries: (keys: string[]) => {
      keys.forEach(key => {
        queryClient.resetQueries({ queryKey: [key] });
      });
    },
  };
}