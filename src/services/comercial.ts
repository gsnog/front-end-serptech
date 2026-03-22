/**
 * src/services/comercial.ts
 * ──────────────────────────
 * API service layer for CRM entities (Leads, Contas, Oportunidades, Atividades).
 * These functions hit the actual Django backend.
 */
import api, { type PaginatedResponse } from '@/lib/api';

// ─── Pipeline funnel stages (UI config — not stored in DB) ───────────────
export const etapasFunil = [
    { id: 'prospeccao', nome: 'Prospecção', probabilidade: 10 },
    { id: 'qualificacao', nome: 'Qualificação', probabilidade: 20 },
    { id: 'diagnostico', nome: 'Diagnóstico', probabilidade: 40 },
    { id: 'proposta', nome: 'Proposta Enviada', probabilidade: 60 },
    { id: 'negociacao', nome: 'Negociação', probabilidade: 80 },
    { id: 'aprovacao', nome: 'Aprovação', probabilidade: 90 },
    { id: 'ganho', nome: 'Fechado Ganho', probabilidade: 100 },
    { id: 'perdido', nome: 'Fechado Perdido', probabilidade: 0 },
];

export const origensLead = [
    'Site', 'Google Ads', 'LinkedIn', 'Indicação', 'Evento', 'Cold Call', 'Email Marketing', 'Parceiro',
];

export const motivosPerda = [
    'Preço', 'Concorrência', 'Timing', 'Orçamento', 'Decisor mudou', 'Projeto cancelado', 'Sem retorno', 'Outro',
];

// ─── Types (for CRM entities — used by forms/tables) ─────────────────────
export type { Lead, Conta, Contato, Oportunidade, Proposta, Pedido, Atividade, Meta, Comissao, ProdutoComercial };

interface Lead { id: number; nome: string; empresa: string; email: string; telefone: string; origem: string; status: string; responsavel: number; score: number; criado_em: string; }
interface Conta { id: number; nome_fantasia: string; razao_social: string; cnpj: string; setor_atuacao: string; site: string; telefone: string; email: string; criado_em: string; }
interface Contato { id: number; nome: string; cargo: string; email: string; telefone: string; principal: boolean; conta: number; criado_em: string; }
interface Oportunidade { id: number; titulo: string; conta: number; valor_estimado: number | string; estagio: string; probabilidade: number; data_fechamento_esperada: string; responsavel: number; criado_em: string; }
interface Atividade { id: number; titulo: string; tipo: string; descricao: string; data: string; hora: string; status: string; lead?: number; conta?: number; oportunidade?: number; responsavel: number; criado_em: string; }
interface Proposta { id: number; numero: string; conta: number; oportunidade: number; status: string; valor: number | string; validade: string; responsavel: number; versao: number; criado_em: string; }
interface Pedido { id: number; numero: string; conta: number; status: string; valor: number | string; condicao_pagamento: string; criado_em: string; }
interface Meta { id: number; responsavel: number; periodo: string; tipo: string; valor_meta: number | string; valor_realizado: number | string; }
interface Comissao { id: number; responsavel: number; oportunidade: number; valor: number | string; status: string; percentual: number | string; data_base: string; }
interface ProdutoComercial { id: string; codigo: string; nome: string; categoria: string; precoBase: number; margem: number; ativo: boolean; }

// --- API calls ---
export const fetchLeads = async (page?: number, search?: string): Promise<Lead[] | PaginatedResponse<Lead>> => {
    const params: Record<string, unknown> = {};
    if (page !== undefined) params.page = page;
    if (search) params.search = search;
    const res = await api.get('/api/crm/leads/', { params });
    return res.data;
};

export const fetchContas = async (page?: number, search?: string): Promise<Conta[] | PaginatedResponse<Conta>> => {
    const params: Record<string, unknown> = {};
    if (page !== undefined) params.page = page;
    if (search) params.search = search;
    const res = await api.get('/api/crm/contas/', { params });
    return res.data;
};

export const fetchOportunidades = async (page?: number, search?: string): Promise<Oportunidade[] | PaginatedResponse<Oportunidade>> => {
    const params: Record<string, unknown> = {};
    if (page !== undefined) params.page = page;
    if (search) params.search = search;
    const res = await api.get('/api/crm/oportunidades/', { params });
    return res.data;
};

export const fetchAtividades = async (page?: number, search?: string): Promise<Atividade[] | PaginatedResponse<Atividade>> => {
    const params: Record<string, unknown> = {};
    if (page !== undefined) params.page = page;
    if (search) params.search = search;
    const res = await api.get('/api/crm/atividades/', { params });
    return res.data;
};

export const fetchContatos = async (page?: number, search?: string): Promise<Contato[] | PaginatedResponse<Contato>> => {
    const params: Record<string, unknown> = {};
    if (page !== undefined) params.page = page;
    if (search) params.search = search;
    const res = await api.get('/api/crm/contatos/', { params });
    return res.data;
};

export const fetchPropostas = async (page?: number): Promise<Proposta[] | PaginatedResponse<Proposta>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/crm/propostas/', { params });
    return res.data;
};

export const fetchPedidos = async (page?: number): Promise<Pedido[] | PaginatedResponse<Pedido>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/crm/pedidos/', { params });
    return res.data;
};

export const fetchMetas = async (page?: number): Promise<Meta[] | PaginatedResponse<Meta>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/crm/metas/', { params });
    return res.data;
};

export const fetchComissoes = async (page?: number): Promise<Comissao[] | PaginatedResponse<Comissao>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/crm/comissoes/', { params });
    return res.data;
};

// React Query Keys
export const leadsQueryKey = ['crm_leads'] as const;
export const contasQueryKey = ['crm_contas'] as const;
export const oportunidadesQueryKey = ['crm_oportunidades'] as const;
export const atividadesQueryKey = ['crm_atividades'] as const;
export const contatosQueryKey = ['crm_contatos'] as const;

// --- Fallbacks para evitar quebra do Vite Rollup ---
export const getContaById = (id: string) => null;
