/**
 * src/services/pessoas.ts
 * ────────────────────────
 * API service layer for pessoas (users) and setores.
 * Replaces all imports from data/pessoas-mock.ts.
 *
 * These types mirror the Django PessoaSerializer and SetorSerializer.
 * Use these types instead of the old Pessoa/Setor from pessoas-mock.ts.
 */
import api, { type PaginatedResponse } from '@/lib/api';

// ─── Types (mirrors backend serializer output) ────────────────────────────

export interface Pessoa {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    nome: string;           // computed: full name or username
    iniciais: string;       // computed: initials e.g. "JS"
    cargo: string;
    setor_id: number | null;
    setor: string | null;
    supervisor_id: number | null;
    supervisor_nome: string | null;
    role: string;           // lowercase group name: admin, gestor, etc.
    profile_image: string | null;
    telefone: string;
    data_admissao: string | null;
    endereco: string;
    stats?: {
        os_criadas: number;
        entradas_aprovadas: number;
    };
    recentActivity?: {
        acao: string;
        data: string;
        modulo: string;
    }[];
}

export interface Setor {
    id: number;
    nome?: string;
    setor?: string;
}

// ─── Type helpers (to keep UI parity with old mock interface) ─────────────

/** Returns display-friendly cargo or a dash */
export const getCargo = (p: Pessoa) => p.cargo || '—';

/** Returns setor name or a dash */
export const getSetor = (p: Pessoa) => p.setor || '—';

/** Returns supervisor name or null */
export const getSupervisorNome = (p: Pessoa) => p.supervisor_nome ?? null;

// ─── API calls ────────────────────────────────────────────────────────────

/** GET /api/pessoas/ — all active users with full profile */
export const fetchPessoas = async (page?: number, search?: string): Promise<Pessoa[] | PaginatedResponse<Pessoa>> => {
    const params: Record<string, unknown> = {};
    if (page !== undefined) params.page = page;
    if (search) params.search = search;
    const res = await api.get('/api/pessoas/', { params });
    return res.data;
};

/** GET /api/pessoas/{id}/ — single user */
export const fetchPessoa = async (id: number): Promise<Pessoa> => {
    const res = await api.get(`/api/pessoas/${id}/`);
    return res.data;
};

/** GET /api/pessoas/me/ — current authenticated user */
export const fetchMe = async (): Promise<Pessoa> => {
    const res = await api.get('/api/pessoas/me/');
    return res.data;
};

/** PATCH /api/pessoas/me/ — update current authenticated user */
export const updateMe = async (data: Partial<Pessoa>): Promise<Pessoa> => {
    const res = await api.patch('/api/pessoas/me/', data);
    return res.data;
};

/** PATCH /api/pessoas/me/ — update current authenticated user with image */
export const updateMeWithImage = async (data: any): Promise<Pessoa> => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        // Only append if value is present and not an empty string for select/id fields if necessary,
        // but for now let's just ensure profile_image is handled.
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });

    const res = await api.patch('/api/pessoas/me/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

/** GET /api/pessoas/meu_time/ — subordinates of current user */
export const fetchMeuTime = async (): Promise<Pessoa[]> => {
    const res = await api.get('/api/pessoas/meu_time/');
    return res.data;
};

/** GET /api/setores/ — all sectors */
export const fetchSetores = async (page?: number): Promise<Setor[] | PaginatedResponse<Setor>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/setores/', { params });
    return res.data;
};

/** GET /api/operacional/setores/ — sectors via operacional route */
export const fetchSetoresOperacional = async (page?: number): Promise<Setor[] | PaginatedResponse<Setor>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/operacional/setores/', { params });
    return res.data;
};

export const createSetor = async (data: Partial<Setor>): Promise<Setor> => {
    const res = await api.post('/api/setores/', data);
    return res.data;
};

export const updateSetor = async (id: number, data: Partial<Setor>): Promise<Setor> => {
    const res = await api.put(`/api/setores/${id}/`, data);
    return res.data;
};

export const deleteSetor = async (id: number): Promise<void> => {
    await api.delete(`/api/setores/${id}/`);
};

/** GET /api/cargos/ — all roles */
export const fetchCargos = async (): Promise<{ id: number, nome: string }[]> => {
    const res = await api.get('/api/cargos/');
    return res.data;
};

/** POST /api/pessoas/ — create new user */
export const createPessoa = async (data: any): Promise<Pessoa> => {
    const res = await api.post('/api/pessoas/', data);
    return res.data;
};

/** PATCH /api/pessoas/{id}/ — update user */
export const updatePessoa = async (id: number, data: any): Promise<Pessoa> => {
    const res = await api.patch(`/api/pessoas/${id}/`, data);
    return res.data;
};

/** PATCH /api/pessoas/{id}/ — update user with image */
export const updatePessoaWithImage = async (id: number, data: any): Promise<Pessoa> => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
            formData.append(key, data[key]);
        }
    });

    const res = await api.patch(`/api/pessoas/${id}/`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

/**
 * GET /api/pessoas/lookup/ — permission-scoped contact list.
 * Admins/gestores: all users. Others: supervisor + peers + subordinates.
 */
export const fetchLookup = async (): Promise<Pessoa[]> => {
    const res = await api.get('/api/pessoas/lookup/');
    return res.data;
};

export const lookupQueryKey = ['pessoas-lookup'] as const;

// ─── Dashboard Stubs (to prevent runtime errors while backend is WIP) ──────────
export const getEstatisticasRH = () => ({
    total: 0,
    ativos: 0,
    afastados: 0,
    desligados: 0,
    semGestor: 0,
    porSetor: [] as { setor: string; quantidade: number }[],
});

export const setoresMock: any[] = [];
export const cargosMock: any[] = [];
export const tiposVinculo = [
    { value: "CLT", label: "CLT" },
    { value: "PJ", label: "PJ" },
    { value: "Estagio", label: "Estágio" }
];

// ─── React Query keys ─────────────────────────────────────────────────────
export const pessoasQueryKey = ['pessoas'] as const;
export const pessoaQueryKey = (id: number) => ['pessoa', id] as const;
export const setoresQueryKey = ['setores'] as const;
