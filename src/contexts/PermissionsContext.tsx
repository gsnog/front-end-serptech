import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react';
import { chatSocket, rtcSocket } from '@/lib/socket';

// ── Types (espelho do backend) ────────────────────────────────────────────────

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

// Roles predefinidas — usadas apenas na UI de exibição de nomes/descrições.
// As permissões reais vêm do backend.
export const systemRoles: Role[] = [
  { id: 'admin',      name: 'Administrador',   description: 'Acesso total ao sistema',               permissions: [] },
  { id: 'rh_admin',   name: 'RH Admin',         description: 'Acesso total ao módulo de pessoas',     permissions: [] },
  { id: 'rh_leitura', name: 'RH Leitura',       description: 'Visualização do módulo de pessoas',     permissions: [] },
  { id: 'gestor',     name: 'Gestor',            description: 'Visualização da equipe',                permissions: [] },
  { id: 'usuario',    name: 'Usuário Comum',     description: 'Acesso básico ao sistema',              permissions: [] },
  { id: 'diretor',    name: 'Diretor',           description: 'Visão gerencial completa',              permissions: [] },
  { id: 'assistente', name: 'Assistente',        description: 'Acesso operacional básico',             permissions: [] },
];

// Dashboards disponíveis
export const availableDashboards = [
  { id: 'geral',      name: 'Dashboard Geral',              sensitive: false },
  { id: 'financeiro', name: 'Dashboard Financeiro',         sensitive: true  },
  { id: 'estoque',    name: 'Dashboard Estoque',            sensitive: false },
  { id: 'patrimonio', name: 'Dashboard Patrimônio',         sensitive: false },
  { id: 'comercial',  name: 'Dashboard Comercial',          sensitive: false },
  { id: 'rh',         name: 'Dashboard Gestão de Pessoas',  sensitive: false },
];

// ── Payload de permissões (retornado pelo backend no login) ───────────────────

export interface UserPermissions {
  userId: string;
  roles: string[];
  is_staff?: boolean;
  /** Permissões granulares vindas da tabela RolePermission */
  permissions: Permission[];
  dashboardAccess: { dashboardId: string; canView: boolean; canViewSensitive: boolean }[];
  exceptions: Permission[];
}

// ── Context type ──────────────────────────────────────────────────────────────

interface PermissionsContextType {
  currentUser: UserPermissions;
  isLoadingUser: boolean;
  hasPermission: (module: string, page: string, action: string) => boolean;
  /** Verifica permissão Django nativa (ex: 'accounts.view_rolepermission') */
  hasDjangoPerm: (perm: string) => boolean;
  hasMenuAccess: (menuPath: string) => boolean;
  hasDashboardAccess: (dashboardId: string, sensitive?: boolean) => boolean;
  getScope: (module: string, page: string) => PermissionScope;
  isStaff: () => boolean;
  setUserPermissions: (permissions: UserPermissions | null) => void;
  login: (token: string, refreshToken: string, permissions: UserPermissions) => void;
  logout: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

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
    return { userId: '', roles: [], permissions: [], dashboardAccess: [], exceptions: [] };
  });

  // true while the initial permissions fetch is in-flight — prevents the auth
  // guard in LayoutShell from redirecting to /login before the fetch resolves.
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(() => {
    // If there's no token, there's nothing to load — no redirect risk.
    return !!localStorage.getItem('accessToken');
  });

  const setUserPermissions = (permissions: UserPermissions | null) => {
    if (permissions) {
      setCurrentUser(permissions);
      localStorage.setItem('userPermissions', JSON.stringify(permissions));
    } else {
      const empty: UserPermissions = { userId: '', roles: [], permissions: [], dashboardAccess: [], exceptions: [] };
      setCurrentUser(empty);
      localStorage.removeItem('userPermissions');
    }
  };

  // Ao montar: reconecta sockets e busca permissões atualizadas do backend.
  // Isso garante que mudanças feitas em Acessos.tsx sejam refletidas sem
  // precisar de novo login — elimina o problema de permissões stale no localStorage.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoadingUser(false);
      return;
    }

    chatSocket.connect();
    rtcSocket.connect();

    // Busca permissões frescas do backend
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/pessoas/me/permissions/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data: UserPermissions | null) => {
        if (data?.userId) setUserPermissions(data);
      })
      .catch(() => {/* silencia falhas de rede — usa cache do localStorage */})
      .finally(() => {
        setIsLoadingUser(false);
      });
  }, []);

  const login = (token: string, refreshToken: string, permissions: UserPermissions) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    setUserPermissions(permissions);
    chatSocket.connect();
    rtcSocket.connect();
  };

  const logout = () => {
    // Disconnect all sockets BEFORE clearing tokens to prevent
    // reconnect timers from firing with a null token after logout
    chatSocket.disconnect();
    rtcSocket.disconnect();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userPermissions');
    setUserPermissions(null);
    window.location.href = '/login';
  };

  // ── Helpers internos ────────────────────────────────────────────────────────

  /** Todas as permissões do usuário (role permissions + exceções) — memoized */
  const allPermissions = useMemo((): Permission[] => [
    ...currentUser.permissions,
    ...currentUser.exceptions,
  ], [currentUser.permissions, currentUser.exceptions]);

  const isAdmin = (): boolean =>
    currentUser.roles.includes('admin');

  const isStaff = (): boolean =>
    !!currentUser.is_staff;

  // ── hasPermission ────────────────────────────────────────────────────────────

  const hasPermission = (module: string, page: string, action: string): boolean => {
    if (isAdmin()) return true;

    const perms = allPermissions;

    // Exceções têm prioridade
    const exception = currentUser.exceptions.find(
      e => (e.module === module || e.module === 'all') && (e.page === page || e.page === 'all'),
    );
    if (exception) return exception.actions.includes(action);

    return perms.some(
      p =>
        (p.module === 'all' || p.module === module) &&
        // page='all' on either side means "any page in this module"
        (p.page === 'all' || page === 'all' || p.page === page) &&
        p.actions.includes(action),
    );
  };

  // ── hasDjangoPerm ─────────────────────────────────────────────────────────────
  // Verifica permissão Django nativa (app_label.codename).
  // Mapeamos para o modelo de módulo/ação do frontend como melhor esforço.
  // Admins sempre passam.

  const hasDjangoPerm = (perm: string): boolean => {
    if (isAdmin()) return true;

    // Mapeamento: 'app_label.action_model' → { module, action }
    const djangoPermMap: Record<string, { module: string; page: string; action: string }> = {
      'accounts.view_rolepermission':   { module: 'gestao_pessoas', page: 'permissoes', action: 'view'   },
      'accounts.change_rolepermission': { module: 'gestao_pessoas', page: 'permissoes', action: 'edit'   },
      'accounts.add_rolepermission':    { module: 'gestao_pessoas', page: 'permissoes', action: 'create' },
      'accounts.delete_rolepermission': { module: 'gestao_pessoas', page: 'permissoes', action: 'delete' },
    };

    const mapped = djangoPermMap[perm];
    if (mapped) return hasPermission(mapped.module, mapped.page, mapped.action);

    // Para permissões não mapeadas, deriva action do codename (view_*, change_*, etc.)
    const [, codename] = perm.split('.');
    if (!codename) return false;
    const action = codename.startsWith('view')   ? 'view'
                 : codename.startsWith('add')    ? 'create'
                 : codename.startsWith('change') ? 'edit'
                 : codename.startsWith('delete') ? 'delete'
                 : codename;
    return hasPermission('all', 'all', action);
  };

  // ── hasMenuAccess ─────────────────────────────────────────────────────────────

  const hasMenuAccess = (menuPath: string): boolean => {
    const menuModuleMap: Record<string, { module: string; page: string }> = {
      '/cadastro/pessoas':  { module: 'cadastro_pessoas', page: 'all' },
      '/gestao-pessoas':    { module: 'gestao_pessoas',   page: 'all' },
      '/calendario':        { module: 'calendario',       page: 'all' },
      '/chat':              { module: 'chat',             page: 'all' },
      '/kanban':            { module: 'kanban',           page: 'all' },
    };

    const mapping = menuModuleMap[menuPath];
    if (!mapping) return true;
    return hasPermission(mapping.module, mapping.page, 'view');
  };

  // ── hasDashboardAccess ────────────────────────────────────────────────────────

  const hasDashboardAccess = (dashboardId: string, sensitive = false): boolean => {
    const access = currentUser.dashboardAccess.find(d => d.dashboardId === dashboardId);
    if (!access) return false;
    if (sensitive) return access.canViewSensitive;
    return access.canView;
  };

  // ── getScope ──────────────────────────────────────────────────────────────────

  const getScope = (module: string, page: string): PermissionScope => {
    const scopePriority: PermissionScope[] = ['self', 'team', 'area', 'all'];
    let highest: PermissionScope = 'self';

    for (const p of allPermissions) {
      if (
        (p.module === 'all' || p.module === module) &&
        (p.page === 'all' || p.page === page)
      ) {
        if (scopePriority.indexOf(p.scope) > scopePriority.indexOf(highest)) {
          highest = p.scope;
        }
      }
    }
    return highest;
  };

  return (
    <PermissionsContext.Provider value={{
      currentUser,
      isLoadingUser,
      hasPermission,
      hasDjangoPerm,
      hasMenuAccess,
      hasDashboardAccess,
      getScope,
      isStaff,
      setUserPermissions,
      login,
      logout,
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
