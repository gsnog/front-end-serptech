import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/contexts/PermissionsContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Permissão Django exata, ex: 'financial.view_contasareceber' */
  perm?: string;
  /** Módulo frontend (usa mapeamento para app_labels Django) */
  module?: string;
  action?: string;
  page?: string;
}

export function ProtectedRoute({ children, perm, module, action = 'view', page = 'all' }: ProtectedRouteProps) {
  const { hasDjangoPerm, hasPermission } = usePermissions();

  const allowed = perm
    ? hasDjangoPerm(perm)
    : module
      ? hasPermission(module, page, action)
      : false; // deny by default — require explicit permission specification

  if (!allowed) return <Navigate to="/acesso-negado" replace />;
  return <>{children}</>;
}
