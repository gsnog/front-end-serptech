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

export const fetchProjetos = async (page?: number): Promise<Projeto[] | PaginatedResponse<Projeto>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/operacional/projetos/', { params });
    return res.data;
};

export const fetchTarefas = async (page?: number): Promise<Tarefa[] | PaginatedResponse<Tarefa>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/operacional/tarefas/', { params });
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

export const fetchEmbarcacoes = async (page?: number): Promise<Embarcacao[] | PaginatedResponse<Embarcacao>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/operacional/embarcacoes/', { params });
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
