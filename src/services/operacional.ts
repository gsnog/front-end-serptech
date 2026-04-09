import api, { type PaginatedResponse } from '@/lib/api';

export interface Projeto {
    id: number;
    nome: string;
    descricao: string;
    data_inicio: string;
    data_fim: string;
    status: string;
    owner: number;
    owner_nome: string;
}

export interface Tarefa {
    id: number;
    projeto: number;
    projeto_nome: string;
    titulo: string;
    descricao: string;
    status: string;
    assignee: number;
    assignee_nome: string;
    prazo: string;
}

export const fetchProjetos = async (): Promise<Projeto[] | PaginatedResponse<Projeto>> => {
    const res = await api.get('/api/operacional/projetos/');
    return res.data;
};

export const fetchTarefas = async (): Promise<Tarefa[] | PaginatedResponse<Tarefa>> => {
    const res = await api.get('/api/operacional/tarefas/');
    return res.data;
};

export const createProjeto = async (data: Partial<Projeto>): Promise<Projeto> => {
    const res = await api.post('/api/operacional/projetos/', data);
    return res.data;
};

export const createTarefa = async (data: Partial<Tarefa>): Promise<Tarefa> => {
    const res = await api.post('/api/operacional/tarefas/', data);
    return res.data;
};

// --- Embarcações ---
export interface Embarcacao {
    id: number;
    nome: string;
    setores: string | null;
    cliente: string | null;
    dimensoes: string | null;
}

export const fetchEmbarcacoes = async (): Promise<Embarcacao[] | PaginatedResponse<Embarcacao>> => {
    const res = await api.get('/api/operacional/embarcacoes/');
    return res.data;
};

export const createEmbarcacao = async (data: Partial<Embarcacao>): Promise<Embarcacao> => {
    const res = await api.post('/api/operacional/embarcacoes/', data);
    return res.data;
};

export const updateEmbarcacao = async (id: number, data: Partial<Embarcacao>): Promise<Embarcacao> => {
    const res = await api.put(`/api/operacional/embarcacoes/${id}/`, data);
    return res.data;
};

export const deleteEmbarcacao = async (id: number): Promise<void> => {
    await api.delete(`/api/operacional/embarcacoes/${id}/`);
};

// ─── Mapas ────────────────────────────────────────────────────────────────────

export interface MapaFilho {
    id: number;
    nome: string;
    mapa_principal: number;
    arquivo_pdf: string;
    arquivo_pdf_url: string | null;
    arquivo_pdf_original: string | null;
    arquivo_pdf_original_url: string | null;
    status: 'concluido' | 'pendente';
    observacao: string | null;
    observacao_conciliacao: string | null;
    mapa_pendente: number | null;
}

export interface MapaPrincipal {
    id: number;
    nome: string | null;
    data_de_recebimento: string | null;
    arquivo_pdf: string | null;
    arquivo_pdf_url: string | null;
    medico?: number | null;
    medico_nome?: string | null;
    filhos_count: number;
    pendentes_count: number;
    filhos?: MapaFilho[];
}

export interface MapasFiltros {
    nome?: string;
    medico?: string;
    data_inicio?: string;
    data_fim?: string;
}

export const fetchMapas = async (page = 1, filtros: MapasFiltros = {}): Promise<PaginatedResponse<MapaPrincipal>> => {
    const params: Record<string, string | number> = { page, page_size: 20 };
    if (filtros.nome) params.nome = filtros.nome;
    if (filtros.medico && filtros.medico !== 'none') params.medico = filtros.medico;
    if (filtros.data_inicio) params.data_inicio = filtros.data_inicio;
    if (filtros.data_fim) params.data_fim = filtros.data_fim;
    const res = await api.get('/api/lab/mapas/', { params });
    return res.data;
};

export const deleteMapa = async (id: number): Promise<void> => {
    await api.delete(`/api/lab/mapas/${id}/`);
};

/** POST /api/lab/mapas/upload/ — upload PDF, trigger OCR split, return parent + children */
export const uploadMapa = async (formData: FormData): Promise<MapaPrincipal> => {
    const res = await api.post('/api/lab/mapas/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

/** GET /api/lab/mapas/{id}/filhos/ */
export const fetchMapaFilhos = async (mapaId: number): Promise<MapaFilho[]> => {
    const res = await api.get(`/api/lab/mapas/${mapaId}/filhos/`);
    return res.data;
};

/** PATCH /api/lab/mapas-filhos/{id}/ — rename */
export const updateMapaFilho = async (id: number, nome: string): Promise<MapaFilho> => {
    const res = await api.patch(`/api/lab/mapas-filhos/${id}/`, { nome });
    return res.data;
};

/** PATCH /api/lab/mapas-filhos/{id}/pendente/ — mark as pending */
export const setMapaFilhoPendente = async (id: number, observacao?: string): Promise<MapaFilho> => {
    const res = await api.patch(`/api/lab/mapas-filhos/${id}/pendente/`, { observacao });
    return res.data;
};

/** POST /api/lab/mapas-filhos/{id}/conciliar/ — resolve pending with new PDF */
export const conciliarMapaFilho = async (id: number, formData: FormData): Promise<MapaFilho> => {
    const res = await api.post(`/api/lab/mapas-filhos/${id}/conciliar/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export const mapasQueryKey = ['lab-mapas'] as const;
export const mapaFilhosQueryKey = (id: number) => ['lab-mapa-filhos', id] as const;

// ─── Exames ───────────────────────────────────────────────────────────────────

export interface Exame {
    id: number;
    nome: string;
}

export const examesQueryKey = ['lab-exames'] as const;

export const fetchExames = async (): Promise<Exame[]> => {
    const res = await api.get('/api/lab/exames/');
    return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const createExame = async (nome: string): Promise<Exame> => {
    const res = await api.post('/api/lab/exames/', { nome });
    return res.data;
};

export const updateExame = async (id: number, nome: string): Promise<Exame> => {
    const res = await api.patch(`/api/lab/exames/${id}/`, { nome });
    return res.data;
};

export const deleteExame = async (id: number): Promise<void> => {
    await api.delete(`/api/lab/exames/${id}/`);
};
