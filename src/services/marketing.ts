/**
 * src/services/marketing.ts
 * ──────────────────────────
 * Structural/config constants for the Marketing module.
 * Feeds from actual Django API endpoints.
 */
import api, { type PaginatedResponse } from '@/lib/api';

export const canaisMarketing = [
    { id: 'canal-1', nome: 'Google Ads', tipo: 'pago' },
    { id: 'canal-2', nome: 'LinkedIn', tipo: 'social' },
    { id: 'canal-3', nome: 'SEO/Orgânico', tipo: 'organico' },
    { id: 'canal-4', nome: 'Email Marketing', tipo: 'email' },
    { id: 'canal-5', nome: 'Indicação', tipo: 'indicacao' },
    { id: 'canal-6', nome: 'Eventos', tipo: 'eventos' },
    { id: 'canal-7', nome: 'Outbound', tipo: 'outbound' },
    { id: 'canal-8', nome: 'Parceiros', tipo: 'parceiros' },
];

export type { Campanha, LeadMarketing, Segmento, ConteudoAsset, LandingPage, Automacao, Evento, OrcamentoMarketing, Canal };

interface Canal { id: number; nome: string; tipo_canal: string; custo_estimado: string; status: string; criado_em: string; }
interface Campanha { id: number; nome: string; tipo_campanha: string; status: string; data_inicio: string; data_fim: string; orcamento: string; custo_real: string; criador: number; criado_em: string; }
interface LeadMarketing { id: number; nome: string; email: string; empresa: string; status: string; pontuacao: number; campanha_origem?: number; canal_origem?: number; criado_em: string; }
interface Segmento { id: string; nome: string; descricao: string; totalContatos: number; ativo: boolean; }
interface ConteudoAsset { id: string; titulo: string; tipo: string; url: string; tema: string; funil: string; downloads: number; createdAt: string; }
interface LandingPage { id: string; nome: string; url: string; status: string; conversoes: number; visitas: number; }
interface Automacao { id: string; nome: string; trigger: string; status: string; execucoes: number; }
interface Evento { id: string; nome: string; tipo: string; data: string; custo: number; leadsCaptados: number; status: string; }
interface OrcamentoMarketing { id: string; periodo: string; orcado: number; realizado: number; categoria: string; }

// API fetchers
export const fetchCampanhas = async (): Promise<Campanha[] | PaginatedResponse<Campanha>> => {
    const res = await api.get('/api/marketing/campanhas/');
    return res.data;
};
export const fetchCanais = async (): Promise<Canal[]> => {
    const res = await api.get('/api/marketing/canais/');
    return res.data;
};
export const fetchLeadsMarketing = async (): Promise<LeadMarketing[] | PaginatedResponse<LeadMarketing>> => {
    const res = await api.get('/api/marketing/leads/');
    return res.data;
};

// React Query Keys
export const campanhasQueryKey = ['marketing_campanhas'] as const;
export const canaisQueryKey = ['marketing_canais'] as const;
export const leadsMarketingQueryKey = ['marketing_leads'] as const;

// --- Fallbacks para evitar quebra do Vite Rollup ---
export const leadsMarketingMock: any[] = [];
export const campanhasMock: any[] = [];
export const canaisMock: any[] = [];
export const leadsPorCanalData: any[] = [];
export const funilMarketingData: any[] = [];
export const roiPorCampanhaData: any[] = [];
export const getMetricasGerais = () => ({
    leads: 0,
    mql: 0,
    sql: 0,
    conversoes: 0,
    roi: 0,
    cac: 0
});
export const calcularMetricasCampanha = () => ({});
export const calcularMetricasCanal = () => ({});
