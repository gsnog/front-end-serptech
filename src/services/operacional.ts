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

export interface MapaPrincipal {
    id: number;
    nome: string | null;
    data_de_recebimento: string | null;
    arquivo_pdf: string | null;
    medico?: number | null;
}

export const fetchMapas = async (page = 1): Promise<PaginatedResponse<MapaPrincipal>> => {
    const res = await api.get('/api/lab/mapas/', { params: { page, page_size: 20 } });
    return res.data;
};

export const createMapa = async (data: Partial<MapaPrincipal>): Promise<MapaPrincipal> => {
    const res = await api.post('/api/lab/mapas/', data);
    return res.data;
};

export const updateMapa = async (id: number, data: Partial<MapaPrincipal>): Promise<MapaPrincipal> => {
    const res = await api.patch(`/api/lab/mapas/${id}/`, data);
    return res.data;
};

export const deleteMapa = async (id: number): Promise<void> => {
    await api.delete(`/api/lab/mapas/${id}/`);
};

export const mapasQueryKey = ['lab-mapas'] as const;
