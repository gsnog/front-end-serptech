import type { UserPermissions } from '@/contexts/PermissionsContext';

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    nome: string;
    role: string;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginResponse extends AuthTokens {
    user?: User;
    /** Permissões completas retornadas pelo backend no login */
    permissions?: UserPermissions;
}
