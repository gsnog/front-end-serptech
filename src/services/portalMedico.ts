import api, { type PaginatedResponse } from '@/lib/api'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface MedicoMe {
  id: number
  nome: string
  email: string
  crm: string
  telefone: string
  especialidades: { id: number; nome: string; descricao: string }[]
}

export interface MapaPortal {
  id: number
  nome: string | null
  data_de_recebimento: string | null
  arquivo_pdf_url: string | null
  filhos_count: number
  pendentes_count: number
  aguardando_verificacao_count: number
  origem: 'manual' | 'medico' | 'automacao'
}

export interface MapaFilhoPortal {
  id: number
  nome: string
  status: 'concluido' | 'pendente' | 'aguardando_verificacao'
  arquivo_pdf_url: string | null
  observacao: string | null
}

export type StatusPortal = 'com_pendencia' | 'em_revisao' | 'processado' | 'enviado'

export function getStatusPortal(mapa: MapaPortal): StatusPortal {
  if (mapa.pendentes_count > 0) return 'com_pendencia'
  if (mapa.aguardando_verificacao_count > 0) return 'em_revisao'
  if (mapa.filhos_count > 0) return 'processado'
  return 'enviado'
}

export const STATUS_PORTAL_LABEL: Record<StatusPortal, string> = {
  com_pendencia: 'Com Pendência',
  em_revisao: 'Em Revisão',
  processado: 'Processado',
  enviado: 'Enviado',
}

export const STATUS_PORTAL_CLASS: Record<StatusPortal, string> = {
  com_pendencia: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500 border-transparent',
  em_revisao: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-transparent',
  processado: 'bg-primary/20 text-primary border-transparent',
  enviado: 'bg-muted text-muted-foreground border-transparent',
}

// ── Query Keys ─────────────────────────────────────────────────────────────

export const portalMedicoKeys = {
  me: ['portal-medico', 'me'] as const,
  mapasAll: ['portal-medico', 'mapas'] as const,
  mapas: (params?: Record<string, string>) =>
    ['portal-medico', 'mapas', params] as const,
  filhos: (mapaId: number) => ['portal-medico', 'filhos', mapaId] as const,
}

// ── API Calls ──────────────────────────────────────────────────────────────

/** Retorna o perfil do médico autenticado. Lança erro se não for médico.
 *  validateStatus evita que o interceptor global mostre toast de 404. */
export async function fetchMedicoMe(): Promise<MedicoMe> {
  const res = await api.get('/api/medicos/me/', {
    validateStatus: status => status === 200 || status === 404,
  })
  if (res.status !== 200) throw new Error('not_medico')
  return res.data
}

/** Lista os mapas do médico autenticado. */
export async function fetchMeusMapas(params?: {
  nome?: string
  data_inicio?: string
  data_fim?: string
  page?: number
  page_size?: number
}): Promise<PaginatedResponse<MapaPortal>> {
  const res = await api.get('/api/lab/mapas/', {
    params: { meu_medico: 'true', ...params },
  })
  return res.data
}

/** Busca as lâminas de um mapa específico. */
export async function fetchFilhosMapa(mapaId: number): Promise<MapaFilhoPortal[]> {
  const res = await api.get(`/api/lab/mapas/${mapaId}/filhos/`)
  return res.data
}

/** Faz upload de novo PDF. O backend detecta o médico pelo JWT automaticamente. */
export async function uploadMapaMedico(formData: FormData): Promise<MapaPortal> {
  const res = await api.post('/api/lab/mapas/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
