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
    cargo_id: number | null;
    setor_id: number | null;
    setor: string | null;
    unidade_id: number | null;
    unidade: string | null;
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
    nome: string;
    codigo?: string | null;
    responsavel_id?: number | null;
    responsavel_nome?: string | null;
}

// ─── Type helpers (to keep UI parity with old mock interface) ─────────────

/** Returns display-friendly cargo or a dash */
export const getCargo = (p: Pessoa) => p.cargo || '—';

/** Returns setor name or a dash */
export const getSetor = (p: Pessoa) => p.setor || '—';

/** Returns supervisor name or null */
export const getSupervisorNome = (p: Pessoa) => p.supervisor_nome ?? null;

// ─── API calls ────────────────────────────────────────────────────────────

/** GET /api/pessoas/ — paginated, filterable list of active users */
export const fetchPessoas = async (
    page = 1,
    search = '',
    pageSize = 10,
): Promise<PaginatedResponse<Pessoa>> => {
    const params: Record<string, string | number> = { page, page_size: pageSize };
    if (search.trim()) params.search = search.trim();
    const res = await api.get('/api/pessoas/', { params });
    // Normalise: backend returns list when no ?page= was sent historically
    if (Array.isArray(res.data)) {
        return { count: res.data.length, next: null, previous: null, results: res.data };
    }
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

/** GET /api/pessoas/relatorio/ — all pessoas without pagination for report generation */
export const fetchPessoasRelatorio = async (search = ''): Promise<Pessoa[]> => {
    const params: Record<string, string> = {};
    if (search.trim()) params.search = search.trim();
    const res = await api.get('/api/pessoas/relatorio/', { params });
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
};

export const pessoasRelatorioQueryKey = ['pessoas-relatorio'] as const;

/** GET /api/pessoas/meu_time/ — subordinates of current user */
export const fetchMeuTime = async (): Promise<Pessoa[]> => {
    const res = await api.get('/api/pessoas/meu_time/');
    return res.data;
};

/** GET /api/setores/ — paginated list of sectors */
export const fetchSetores = async (
    page?: number,
    pageSize = 20,
): Promise<Setor[] | PaginatedResponse<Setor>> => {
    const params: Record<string, string | number> = {};
    if (page !== undefined) { params.page = page; params.page_size = pageSize; }
    const res = await api.get('/api/setores/', { params });
    return res.data;
};

/** GET /api/setores/ — sectors via operacional (alias for fetchSetores) */
export const fetchSetoresOperacional = async (): Promise<Setor[] | PaginatedResponse<Setor>> => {
    const res = await api.get('/api/setores/');
    return res.data;
};

export interface FuncionarioSimple { id: number; nome: string; django_user_id: number; }

export const fetchFuncionarios = async (): Promise<FuncionarioSimple[]> => {
    const res = await api.get('/api/funcionarios/');
    return res.data?.results ?? res.data;
};

// ── Médicos ───────────────────────────────────────────────────────────────────
export interface Especialidade { id: number; nome: string; descricao: string; }

export interface Medico {
    id: number;
    nome: string;
    email: string;
    crm: string;
    telefone: string;
    valor_lamina_lida?: number | null;
    especialidades: Especialidade[];
    especialidade_ids?: number[];
    user?: number;
}

export const fetchMedicos = async (page = 1, search = ''): Promise<PaginatedResponse<Medico>> => {
    const params: Record<string, string | number> = { page };
    if (search) params.search = search;
    const res = await api.get('/api/medicos/', { params });
    return res.data;
};

/** GET /api/medicos/ sem paginação — para uso em dropdowns */
export const fetchAllMedicos = async (): Promise<Medico[]> => {
    const res = await api.get('/api/medicos/');
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
};

export const createMedico = async (data: Partial<Medico> & { user: number }): Promise<Medico> => {
    const res = await api.post('/api/medicos/', data);
    return res.data;
};

export const updateMedico = async (id: number, data: Partial<Medico>): Promise<Medico> => {
    const res = await api.patch(`/api/medicos/${id}/`, data);
    return res.data;
};

export const deleteMedico = async (id: number): Promise<void> => {
    await api.delete(`/api/medicos/${id}/`);
};

export const fetchEspecialidades = async (): Promise<Especialidade[]> => {
    const res = await api.get('/api/especialidades/');
    return res.data?.results ?? res.data;
};

export const medicosQueryKey = ['medicos'] as const;

export const createSetor = async (data: Partial<Setor>): Promise<Setor> => {
    const res = await api.post('/api/setores/', data);
    return res.data;
};

export const updateSetor = async (id: number, data: Partial<Setor>): Promise<Setor> => {
    const res = await api.patch(`/api/setores/${id}/`, data);
    return res.data;
};

export const deleteSetor = async (id: number): Promise<void> => {
    await api.delete(`/api/setores/${id}/`);
};

/** GET /api/cargos/ — all roles */
export const fetchCargos = async (): Promise<{ id: number, nome: string }[]> => {
    const res = await api.get('/api/cargos/');
    return Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
};

/** POST /api/cargos/ — create cargo */
export const createCargo = async (data: { nome: string; descricao?: string; salario?: number; carga_horaria?: number; requisitos?: string; bonus?: number }): Promise<{ id: number; nome: string }> => {
    const res = await api.post('/api/cargos/', data);
    return res.data;
};

/** PATCH /api/cargos/{id}/ — update cargo */
export const updateCargo = async (id: number, data: { nome: string }): Promise<{ id: number; nome: string }> => {
    const res = await api.patch(`/api/cargos/${id}/`, data);
    return res.data;
};

/** DELETE /api/cargos/{id}/ — delete cargo */
export const deleteCargo = async (id: number): Promise<void> => {
    await api.delete(`/api/cargos/${id}/`);
};

export const cargosQueryKey = ['cargos'] as const;

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

/** DELETE /api/pessoas/{id}/ — remove user permanently (requires admin/rh_admin) */
export const deletePessoa = async (id: number): Promise<void> => {
    await api.delete(`/api/pessoas/${id}/`);
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

// ─── Auditoria ────────────────────────────────────────────────────────────────

export interface RegistroAuditoria {
    id: number;
    tipo: string;
    acao: string;
    pessoa_nome: string;
    usuario_nome: string;
    data_hora: string;
    detalhes: string;
}

/** GET /api/auditoria/ — paginated audit log */
export const fetchAuditoria = async (
    page = 1,
    search = '',
    tipo = '',
    data_inicio = '',
    data_fim = '',
    pageSize = 20,
): Promise<PaginatedResponse<RegistroAuditoria>> => {
    const params: Record<string, string | number> = { page, page_size: pageSize };
    if (search.trim()) params.search = search.trim();
    if (tipo) params.tipo = tipo;
    if (data_inicio) params.data_inicio = data_inicio;
    if (data_fim) params.data_fim = data_fim;
    const res = await api.get('/api/auditoria/', { params });
    if (Array.isArray(res.data)) {
        return { count: res.data.length, next: null, previous: null, results: res.data };
    }
    return res.data;
};

export const auditoriaQueryKey = ['auditoria'] as const;

/** PATCH /api/pessoas/{id}/grupo/ — assign role (Django Group) to user */
export const setGrupoPessoa = async (id: number, grupo: string): Promise<Pessoa> => {
    const res = await api.patch(`/api/pessoas/${id}/grupo/`, { grupo });
    return res.data;
};

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
    { value: "clt", label: "CLT" },
    { value: "pj", label: "PJ" },
    { value: "estagio", label: "Estágio" },
    { value: "temporario", label: "Temporário" },
    { value: "autonomo", label: "Autônomo" },
    { value: "socio", label: "Sócio" },
];

// ─── React Query keys ─────────────────────────────────────────────────────
export const pessoasQueryKey = ['pessoas'] as const;
export const pessoaQueryKey = (id: number) => ['pessoa', id] as const;
export const setoresQueryKey = ['setores'] as const;
