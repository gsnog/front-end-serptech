import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { chatSocket, rtcSocket } from '@/lib/socket';

// Tipos de permissão
export type PermissionScope = 'self' | 'team' | 'area' | 'all';

export type Permission = {
  module: string;
  page: string;
  actions: string[];
  scope: PermissionScope;
};

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
};

// Roles predefinidas do sistema
export const systemRoles: Role[] = [
  {
    id: 'admin',
    name: 'Administrador',
    description: 'Acesso total ao sistema',
    permissions: [
      { module: 'all', page: 'all', actions: ['view', 'create', 'edit', 'delete', 'approve', 'export'], scope: 'all' }
    ]
  },
  {
    id: 'rh_admin',
    name: 'RH Admin',
    description: 'Acesso total ao módulo de pessoas',
    permissions: [
      { module: 'cadastro_pessoas', page: 'all', actions: ['view', 'create', 'edit', 'delete'], scope: 'all' },
      { module: 'gestao_pessoas', page: 'all', actions: ['view', 'create', 'edit', 'delete'], scope: 'all' },
      { module: 'dashboard', page: 'all', actions: ['view'], scope: 'all' }
    ]
  },
  {
    id: 'rh_leitura',
    name: 'RH Leitura',
    description: 'Visualização do módulo de pessoas',
    permissions: [
      { module: 'gestao_pessoas', page: 'pessoas', actions: ['view'], scope: 'all' },
      { module: 'gestao_pessoas', page: 'hierarquia', actions: ['view'], scope: 'all' }
    ]
  },
  {
    id: 'gestor',
    name: 'Gestor',
    description: 'Visualização da equipe',
    permissions: [
      { module: 'gestao_pessoas', page: 'pessoas', actions: ['view'], scope: 'team' },
      { module: 'gestao_pessoas', page: 'hierarquia', actions: ['view'], scope: 'team' },
      { module: 'calendario', page: 'all', actions: ['view', 'create', 'edit'], scope: 'team' },
      { module: 'chat', page: 'all', actions: ['view', 'create'], scope: 'all' },
      { module: 'kanban', page: 'all', actions: ['view', 'create', 'edit'], scope: 'team' }
    ]
  },
  {
    id: 'usuario',
    name: 'Usuário Comum',
    description: 'Acesso básico ao sistema',
    permissions: [
      { module: 'gestao_pessoas', page: 'hierarquia', actions: ['view'], scope: 'self' },
      { module: 'calendario', page: 'all', actions: ['view', 'create'], scope: 'self' },
      { module: 'chat', page: 'all', actions: ['view', 'create'], scope: 'all' },
      { module: 'kanban', page: 'all', actions: ['view', 'create'], scope: 'self' }
    ]
  },
  {
    id: 'diretor',
    name: 'Diretor',
    description: 'Visão gerencial completa',
    permissions: [
      { module: 'all', page: 'all', actions: ['view'], scope: 'all' },
      { module: 'dashboard', page: 'all', actions: ['view'], scope: 'all' },
      { module: 'gestao_pessoas', page: 'hierarquia', actions: ['view'], scope: 'all' }
    ]
  },
  {
    id: 'assistente',
    name: 'Assistente',
    description: 'Acesso operacional básico',
    permissions: [
      { module: 'all', page: 'all', actions: ['view'], scope: 'all' },
      { module: 'estoque', page: 'entradas', actions: ['view', 'create'], scope: 'all' }
    ]
  }
];

// Dashboards disponíveis
export const availableDashboards = [
  { id: 'geral', name: 'Dashboard Geral', sensitive: false },
  { id: 'financeiro', name: 'Dashboard Financeiro', sensitive: true },
  { id: 'estoque', name: 'Dashboard Estoque', sensitive: false },
  { id: 'patrimonio', name: 'Dashboard Patrimônio', sensitive: false },
  { id: 'comercial', name: 'Dashboard Comercial', sensitive: false },
  { id: 'rh', name: 'Dashboard Gestão de Pessoas', sensitive: false },
];

interface UserPermissions {
  userId: string;
  roles: string[];
  dashboardAccess: { dashboardId: string; canView: boolean; canViewSensitive: boolean }[];
  exceptions: Permission[];
}

interface PermissionsContextType {
  currentUser: UserPermissions;
  hasPermission: (module: string, page: string, action: string) => boolean;
  hasMenuAccess: (menuPath: string) => boolean;
  hasDashboardAccess: (dashboardId: string, sensitive?: boolean) => boolean;
  getScope: (module: string, page: string) => PermissionScope;
  setUserPermissions: (permissions: UserPermissions | null) => void;
  login: (token: string, refreshToken: string, permissions: UserPermissions) => void;
  logout: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserPermissions>(() => {
    const saved = localStorage.getItem('userPermissions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao ler permissões do localStorage:', e);
      }
    }
    return {
      userId: '',
      roles: [],
      dashboardAccess: [],
      exceptions: []
    };
  });

  const setUserPermissions = (permissions: UserPermissions | null) => {
    if (permissions) {
      setCurrentUser(permissions);
      localStorage.setItem('userPermissions', JSON.stringify(permissions));
    } else {
      const empty = { userId: '', roles: [], dashboardAccess: [], exceptions: [] };
      setCurrentUser(empty);
      localStorage.removeItem('userPermissions');
    }
  };

  // Connect sockets on app load if token exists (apenas na montagem)
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      chatSocket.connect();
      rtcSocket.connect();
    }
  }, []);

  const login = (token: string, refreshToken: string, permissions: UserPermissions) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    setUserPermissions(permissions);

    // Connect sockets upon successful login
    chatSocket.connect();
    rtcSocket.connect();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userPermissions');
    setUserPermissions(null);

    // Disconnect sockets purely on logout
    chatSocket.disconnect();
    rtcSocket.disconnect();

    window.location.href = '/login';
  };

  const getUserRoles = (): Role[] => {
    return currentUser.roles.map(roleId => systemRoles.find(r => r.id === roleId)).filter(Boolean) as Role[];
  };


  const hasPermission = (module: string, page: string, action: string): boolean => {
    const roles = getUserRoles();

    // Verifica exceções primeiro
    const exception = currentUser.exceptions.find(
      e => e.module === module && (e.page === page || e.page === 'all')
    );
    if (exception) {
      return exception.actions.includes(action);
    }

    // Verifica permissões das roles
    for (const role of roles) {
      for (const permission of role.permissions) {
        if (
          (permission.module === 'all' || permission.module === module) &&
          (permission.page === 'all' || permission.page === page) &&
          permission.actions.includes(action)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const hasMenuAccess = (menuPath: string): boolean => {
    // Mapeia paths do menu para módulos
    const menuModuleMap: Record<string, { module: string; page: string }> = {
      '/cadastro/pessoas': { module: 'cadastro_pessoas', page: 'all' },
      '/gestao-pessoas': { module: 'gestao_pessoas', page: 'all' },
      '/calendario': { module: 'calendario', page: 'all' },
      '/chat': { module: 'chat', page: 'all' },
      '/kanban': { module: 'kanban', page: 'all' },
    };

    const mapping = menuModuleMap[menuPath];
    if (!mapping) return true; // Menus não mapeados são acessíveis por padrão

    return hasPermission(mapping.module, mapping.page, 'view');
  };

  const hasDashboardAccess = (dashboardId: string, sensitive = false): boolean => {
    const access = currentUser.dashboardAccess.find(d => d.dashboardId === dashboardId);
    if (!access) return false;
    if (sensitive) return access.canViewSensitive;
    return access.canView;
  };

  const getScope = (module: string, page: string): PermissionScope => {
    const roles = getUserRoles();
    let highestScope: PermissionScope = 'self';
    const scopePriority: PermissionScope[] = ['self', 'team', 'area', 'all'];

    for (const role of roles) {
      for (const permission of role.permissions) {
        if (
          (permission.module === 'all' || permission.module === module) &&
          (permission.page === 'all' || permission.page === page)
        ) {
          const currentPriority = scopePriority.indexOf(permission.scope);
          const highestPriority = scopePriority.indexOf(highestScope);
          if (currentPriority > highestPriority) {
            highestScope = permission.scope;
          }
        }
      }
    }
    return highestScope;
  };

  const setUserRole = (roleId: string) => {
    setCurrentUser(prev => ({
      ...prev,
      roles: [roleId]
    }));
  };

  return (
    <PermissionsContext.Provider value={{
      currentUser,
      hasPermission,
      hasMenuAccess,
      hasDashboardAccess,
      getScope,
      setUserPermissions,
      login,
      logout
    }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
