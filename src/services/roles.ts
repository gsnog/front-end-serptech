/**
 * src/services/roles.ts
 * ─────────────────────
 * API service layer for roles (Django Groups) and their granular permissions.
 * Mirrors the backend RoleViewSet at /api/roles/.
 */
import api from '@/lib/api';
import type { Permission } from '@/contexts/PermissionsContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoleAPI {
    id: number;
    name: string;
    permissions: Permission[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** GET /api/roles/ — lista todos os perfis com suas permissões */
export const fetchRoles = async (): Promise<RoleAPI[]> => {
    const res = await api.get('/api/roles/');
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
};

/** GET /api/roles/{id}/ — detalhe de um perfil */
export const fetchRole = async (id: number): Promise<RoleAPI> => {
    const res = await api.get(`/api/roles/${id}/`);
    return res.data;
};

/**
 * PATCH /api/roles/{id}/permissions/
 * Substitui todas as permissões do perfil.
 * Apenas admins podem chamar este endpoint.
 */
export const setRolePermissions = async (
    id: number,
    permissions: Permission[],
): Promise<RoleAPI> => {
    const res = await api.patch(`/api/roles/${id}/permissions/`, { permissions });
    return res.data;
};

/** POST /api/roles/ — cria um novo perfil (admin only) */
export const createRole = async (name: string): Promise<RoleAPI> => {
    const res = await api.post('/api/roles/', { name });
    return res.data;
};

/** DELETE /api/roles/{id}/ — exclui um perfil (admin only, perfis do sistema são protegidos) */
export const deleteRole = async (id: number): Promise<void> => {
    await api.delete(`/api/roles/${id}/`);
};

// ── React Query keys ─────────────────────────────────────────────────────────

export const rolesQueryKey = ['roles'] as const;
export const roleQueryKey  = (id: number) => ['role', id] as const;
