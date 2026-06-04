import api, { type PaginatedResponse } from '@/lib/api';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface EstatisticasFinanceiras {
    saldo: number;
    entradas: number;
    saidas: number;
}

export interface Parcela {
    id: number;
    conta_receber?: number;
    conta_pagar?: number;
    conta_receber_nome?: string;
    conta_pagar_nome?: string;
    numero: number;
    data_de_vencimento: string;
    valor: number;
    valor_pago: number;
    data_de_pagamento: string | null;
    status: string;
    saldo?: number | null;
    valor_efetivo?: number | null;
}

export interface ContaPagar {
    id: number;
    beneficiario?: number;
    fornecedor_nome?: string;
    documento?: string;
    numero_documento?: string;
    valor_do_titulo?: number;
    valor_total?: number;
    data_de_lancamento?: string;
    data_de_faturamento?: string;
    data_de_vencimento?: string;
    status?: string;
    parcelas?: ParcelaReceber[];
    centro_de_custo?: number | null;
    plano_de_contas?: number | null;
    centro_de_custo_detalhe?: CentroCusto | null;
    plano_de_contas_detalhe?: PlanoContas | null;
    total_parcelas?: number;
    proxima_data_vencimento?: string | null;
    parcelas_em_atraso?: number;
}

export interface ParcelaReceber {
    id: number;
    numero: number;
    data_de_vencimento: string | null;
    valor: number;
    valor_pago: number | null;
    status: string;
    data_de_pagamento: string | null;
    forma_de_pagamento: string | null;
    conta_bancaria: number | null;
    comprovante?: string | null;
}

export const updateParcelaReceber = async (id: number, data: Partial<ParcelaReceber>): Promise<ParcelaReceber> => {
    const res = await api.patch(`/api/financial/parcelas/${id}/`, data);
    return res.data;
};

export const uploadComprovante = async (parcelaId: number, file: File): Promise<{ comprovante: string }> => {
    const formData = new FormData();
    formData.append('comprovante', file);
    const res = await api.patch(`/api/financial/parcelas/${parcelaId}/comprovante/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

export interface ContaReceber {
    id: number;
    cliente?: number;
    cliente_nome?: string;
    documento?: string;
    numero_documento?: string;
    valor_do_titulo?: number;
    valor_total?: number;
    data_de_lancamento?: string;
    data_de_faturamento?: string;
    data_de_vencimento?: string;
    status?: string;
    parcelas?: ParcelaReceber[];
    centro_de_receita_detalhe?: CentroReceita | null;
    plano_de_contas_detalhe?: PlanoContas | null;
    total_parcelas?: number;
    proxima_data_vencimento?: string | null;
    parcelas_em_atraso?: number;
}

export interface ContaBancaria {
    id: number;
    unidade?: number;
    unidade_nome?: string;
    codigo_banco?: string;
    banco?: string;
    agencia?: string;
    numero_conta?: string;
    tipo?: string;
    saldo?: number;
}

export interface CentroCusto {
    id: number;
    centro_id?: string;
    setor?: number;
    setor_nome?: string;
    area?: number;
    area_nome?: string;
    area_final?: number | null;
}

export interface CentroReceita {
    id: number;
    centro_id?: string;
    setor?: number;
    setor_nome?: string;
    area?: number;
    area_nome?: string;
    area_final?: number | null;
}

export interface Area {
    id: number;
    nome: string;
}

export interface CategoriaFinanceira {
    id: number;
    nome: string;
}

export interface ClassificacaoFinanceira {
    id: number;
    nome: string;
}

export interface PlanoContas {
    id: number;
    id_plano: string;
    categoria?: number;
    categoria_nome?: string;
    classificacao?: number;
    classificacao_nome?: string;
}

export interface Conciliacao {
    id: number;
    data: string;
    valor_total: number;
    descricao: string;
    codigo_banco: string;
    agencia?: string;
    numero_conta: string;
    conciliacao: string;
    conta_nome?: string;
}

export interface Transacao {
    id: number;
    data_de_lancamento: string;
    valor: number;
    descricao?: string;
    conta_origem: number;
    conta_origem_nome?: string;
    conta_destino: number;
    conta_destino_nome?: string;
}

export interface TransacaoBancaria {
    id: number;
    data_transacao: string;
    valor: number;
    descricao: string;
    tipo: 'credito' | 'debito';
    id_transacao_banco: string;
    conciliado: boolean;
}

// ─── Estatísticas ────────────────────────────────────────────────────────────

export const fetchEstatisticasFinanceiras = async (
    params?: { periodo?: string; date_from?: string; date_to?: string }
): Promise<EstatisticasFinanceiras> => {
    const res = await api.get('/api/financial/estatisticas/', { params });
    return res.data;
};

export interface FluxoCaixaEstatisticas {
    saldo: number;
    entradas: number;
    saidas: number;
}

export const fetchFluxoCaixaEstatisticas = async (): Promise<FluxoCaixaEstatisticas> => {
    const res = await api.get('/api/financial/fluxo-caixa/estatisticas/');
    return res.data;
};

export interface DashboardParams {
    periodo?: string;
    date_from?: string;
    date_to?: string;
    unidade?: string;
}

export const fetchDashboardFull = async (params: DashboardParams = {}): Promise<any> => {
    const res = await api.get('/api/dashboard-full/', { params });
    return res.data;
};

// ─── Parcelas ─────────────────────────────────────────────────────────────────

export const fetchParcelas = async (page = 1, status?: string, dateFrom?: string, dateTo?: string, dateField?: string): Promise<PaginatedResponse<Parcela>> => {
    const params: any = { page, page_size: 20 };
    if (status) params.status = status;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;
    if (dateField) params.date_field = dateField;
    const res = await api.get('/api/financial/parcelas/', { params });
    return res.data;
};

export const createParcela = async (data: Record<string, unknown>): Promise<ParcelaReceber> => {
    const res = await api.post('/api/financial/parcelas/', data);
    return res.data;
};

export const deleteParcela = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/parcelas/${id}/`);
};

interface ParcelaReparcelar {
    numero: number;
    data_de_vencimento: string | null;
    valor: number;
}

export const reparcelarContaPagar = async (id: number, parcelas: ParcelaReparcelar[]): Promise<ContaPagar> => {
    const res = await api.post(`/api/financial/contas_pagar/${id}/reparcelar/`, { parcelas });
    return res.data;
};

export const reparcelarContaReceber = async (id: number, parcelas: ParcelaReparcelar[]): Promise<ContaReceber> => {
    const res = await api.post(`/api/financial/contas_receber/${id}/reparcelar/`, { parcelas });
    return res.data;
};

// ─── Contas a Pagar ───────────────────────────────────────────────────────────

export const fetchContasPagar = async (
    page = 1,
    filters: { beneficiario?: string; documento?: string; dataInicio?: string; dataFim?: string; dateType?: string } = {}
): Promise<PaginatedResponse<ContaPagar>> => {
    const params: Record<string, string | number> = { page, page_size: 20 };
    if (filters.beneficiario) params['fornecedor_nome'] = filters.beneficiario;
    if (filters.documento) params['numero_documento'] = filters.documento;
    if (filters.dateType) params['date_type'] = filters.dateType;
    if (filters.dataInicio) params['date_from'] = filters.dataInicio;
    if (filters.dataFim) params['date_to'] = filters.dataFim;
    const res = await api.get('/api/financial/contas_pagar/', { params });
    return res.data;
};
export const createContaPagar = async (data: Partial<ContaPagar>): Promise<ContaPagar> => {
    const res = await api.post('/api/financial/contas_pagar/', data);
    return res.data;
};
export const updateContaPagar = async (id: number, data: Partial<ContaPagar>): Promise<ContaPagar> => {
    const res = await api.put(`/api/financial/contas_pagar/${id}/`, data);
    return res.data;
};
export const patchContaPagar = async (id: number, data: Partial<ContaPagar>): Promise<ContaPagar> => {
    const res = await api.patch(`/api/financial/contas_pagar/${id}/`, data);
    return res.data;
};
export const deleteContaPagar = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/contas_pagar/${id}/`);
};
export const fetchContasPagarPendentes = async (): Promise<PaginatedResponse<ContaPagar>> => {
    const res = await api.get('/api/financial/contas_pagar/pendentes-classificacao/');
    return res.data;
};

export interface ContasPagarEstatisticas {
    total_pago: number;
    total_a_pagar: number;
    total_projetado: number;
}

export const fetchContasPagarEstatisticas = async (): Promise<ContasPagarEstatisticas> => {
    const res = await api.get('/api/financial/contas_pagar/estatisticas/');
    return res.data;
};

// ─── Contas a Receber ─────────────────────────────────────────────────────────

export const fetchContasReceber = async (
    page = 1,
    filters: { cliente?: string; documento?: string; dataInicio?: string; dataFim?: string; dateType?: string } = {}
): Promise<PaginatedResponse<ContaReceber>> => {
    const params: Record<string, string | number> = { page, page_size: 20 };
    if (filters.cliente) params['cliente_nome'] = filters.cliente;
    if (filters.documento) params['numero_documento'] = filters.documento;
    if (filters.dateType) params['date_type'] = filters.dateType;
    if (filters.dataInicio) params['date_from'] = filters.dataInicio;
    if (filters.dataFim) params['date_to'] = filters.dataFim;
    const res = await api.get('/api/financial/contas_receber/', { params });
    return res.data;
};
export const createContaReceber = async (data: Partial<ContaReceber>): Promise<ContaReceber> => {
    const res = await api.post('/api/financial/contas_receber/', data);
    return res.data;
};
export const updateContaReceber = async (id: number, data: Partial<ContaReceber>): Promise<ContaReceber> => {
    const res = await api.put(`/api/financial/contas_receber/${id}/`, data);
    return res.data;
};
export const deleteContaReceber = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/contas_receber/${id}/`);
};

export interface ContasReceberEstatisticas {
    total_recebido: number;
    total_a_receber: number;
    total_projetado: number;
}

export const fetchContasReceberEstatisticas = async (): Promise<ContasReceberEstatisticas> => {
    const res = await api.get('/api/financial/contas_receber/estatisticas/');
    return res.data;
};

// ─── Conta Bancária ───────────────────────────────────────────────────────────

export const fetchContasBancarias = async (): Promise<ContaBancaria[] | PaginatedResponse<ContaBancaria>> => {
    const res = await api.get('/api/financial/contas_bancarias/');
    return res.data;
};
export const createContaBancaria = async (data: Partial<ContaBancaria>): Promise<ContaBancaria> => {
    const res = await api.post('/api/financial/contas_bancarias/', data);
    return res.data;
};
export const updateContaBancaria = async (id: number, data: Partial<ContaBancaria>): Promise<ContaBancaria> => {
    const res = await api.put(`/api/financial/contas_bancarias/${id}/`, data);
    return res.data;
};
export const deleteContaBancaria = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/contas_bancarias/${id}/`);
};

// ─── Centro de Custo ──────────────────────────────────────────────────────────

export const fetchCentrosCusto = async (): Promise<CentroCusto[] | PaginatedResponse<CentroCusto>> => {
    const res = await api.get('/api/financial/centro-custo/');
    return res.data;
};
export const createCentroCusto = async (data: Partial<CentroCusto>): Promise<CentroCusto> => {
    const res = await api.post('/api/financial/centro-custo/', data);
    return res.data;
};
export const updateCentroCusto = async (id: number, data: Partial<CentroCusto>): Promise<CentroCusto> => {
    const res = await api.put(`/api/financial/centro-custo/${id}/`, data);
    return res.data;
};
export const deleteCentroCusto = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/centro-custo/${id}/`);
};

// ─── Centro de Receita ────────────────────────────────────────────────────────

export const fetchCentrosReceita = async (): Promise<CentroReceita[] | PaginatedResponse<CentroReceita>> => {
    const res = await api.get('/api/financial/centro-receita/');
    return res.data;
};
export const createCentroReceita = async (data: Partial<CentroReceita>): Promise<CentroReceita> => {
    const res = await api.post('/api/financial/centro-receita/', data);
    return res.data;
};
export const updateCentroReceita = async (id: number, data: Partial<CentroReceita>): Promise<CentroReceita> => {
    const res = await api.put(`/api/financial/centro-receita/${id}/`, data);
    return res.data;
};
export const deleteCentroReceita = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/centro-receita/${id}/`);
};

// ─── Areas ────────────────────────────────────────────────────────────────────

export const fetchAreas = async (): Promise<Area[]> => {
    const res = await api.get('/api/financial/areas/');
    return res.data;
};

// ─── Categorias Financeiras ───────────────────────────────────────────────────

export const fetchCategoriasFinanceiras = async (): Promise<CategoriaFinanceira[] | PaginatedResponse<CategoriaFinanceira>> => {
    const res = await api.get('/api/financial/categorias/');
    return res.data;
};
export const createCategoriaFinanceira = async (data: Partial<CategoriaFinanceira>): Promise<CategoriaFinanceira> => {
    const res = await api.post('/api/financial/categorias/', data);
    return res.data;
};
export const updateCategoriaFinanceira = async (id: number, data: Partial<CategoriaFinanceira>): Promise<CategoriaFinanceira> => {
    const res = await api.put(`/api/financial/categorias/${id}/`, data);
    return res.data;
};
export const deleteCategoriaFinanceira = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/categorias/${id}/`);
};

// ─── Classificações ───────────────────────────────────────────────────────────

export const fetchClassificacoesFinanceiras = async (): Promise<ClassificacaoFinanceira[]> => {
    const res = await api.get('/api/financial/classificacoes/');
    return res.data;
};
export const createClassificacaoFinanceira = async (data: Partial<ClassificacaoFinanceira>): Promise<ClassificacaoFinanceira> => {
    const res = await api.post('/api/financial/classificacoes/', data);
    return res.data;
};
export const updateClassificacaoFinanceira = async (id: number, data: Partial<ClassificacaoFinanceira>): Promise<ClassificacaoFinanceira> => {
    const res = await api.put(`/api/financial/classificacoes/${id}/`, data);
    return res.data;
};
export const deleteClassificacaoFinanceira = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/classificacoes/${id}/`);
};

// ─── Plano de Contas ──────────────────────────────────────────────────────────

export const fetchPlanoContas = async (): Promise<PlanoContas[] | PaginatedResponse<PlanoContas>> => {
    const res = await api.get('/api/financial/plano-contas/');
    return res.data;
};
export const createPlanoContas = async (data: Partial<PlanoContas>): Promise<PlanoContas> => {
    const res = await api.post('/api/financial/plano-contas/', data);
    return res.data;
};
export const updatePlanoContas = async (id: number, data: Partial<PlanoContas>): Promise<PlanoContas> => {
    const res = await api.put(`/api/financial/plano-contas/${id}/`, data);
    return res.data;
};
export const deletePlanoContas = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/plano-contas/${id}/`);
};

// ─── Conciliações ─────────────────────────────────────────────────────────────

export interface ConciliacaoParaConciliar {
    conciliacao: Conciliacao;
    contas_a_receber: ContaReceber[];
    contas_a_pagar: ContaPagar[];
}

export const fetchConciliacoes = async (): Promise<Conciliacao[]> => {
    const res = await api.get('/api/financial/conciliacoes/');
    return res.data;
};

export const fetchConciliacaoParaConciliar = async (id: number): Promise<ConciliacaoParaConciliar> => {
    const res = await api.get(`/api/financial/conciliacoes/${id}/conciliar/`);
    return res.data;
};

export const efetivarConciliacaoBancaria = async (
    conciliacaoId: number,
    payload: { conta_tipo: 'receber' | 'pagar'; conta_id: number }
): Promise<any> => {
    const res = await api.post(`/api/financial/conciliacoes/${conciliacaoId}/conciliar/efetivar/`, payload);
    return res.data;
};
export const deleteConciliacao = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/conciliacoes/${id}/`);
};

// ─── Transferências ───────────────────────────────────────────────────────────

export const fetchTransferencias = async (): Promise<Transacao[] | PaginatedResponse<Transacao>> => {
    const res = await api.get('/api/financial/transferencias/');
    return res.data;
};
export const createTransferencia = async (data: Partial<Transacao>): Promise<Transacao> => {
    const res = await api.post('/api/financial/transferencias/', data);
    return res.data;
};
export const updateTransferencia = async (id: number, data: Partial<Transacao>): Promise<Transacao> => {
    const res = await api.put(`/api/financial/transferencias/${id}/`, data);
    return res.data;
};
export const deleteTransferencia = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/transferencias/${id}/`);
};

// ─── Conciliação Bancária (Nova) ─────────────────────────────────────────────

export const importarOfxNovo = async (file: File): Promise<Conciliacao[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/financial/importar-ofx-novo/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};

export const conciliarLancamento = async (
    transacaoBancariaId: number,
    lancamentoId: number,
    lancamentoTipo: 'contas_pagar' | 'contas_receber'
): Promise<any> => {
    const res = await api.post('/api/financial/conciliar-novo/', {
        transacao_bancaria_id: transacaoBancariaId,
        lancamento_id: lancamentoId,
        lancamento_tipo: lancamentoTipo,
    });
    return res.data;
};

// ─── Subcategorias Financeiras ───────────────────────────────────────────────

export interface SubcategoriaFinanceira {
    id: number;
    nome: string;
    categoria: number;
    categoria_nome?: string;
}

export const fetchSubcategorias = async (): Promise<SubcategoriaFinanceira[] | PaginatedResponse<SubcategoriaFinanceira>> => {
    const res = await api.get('/api/financial/subcategorias/');
    return res.data;
};
export const createSubcategoria = async (data: Partial<SubcategoriaFinanceira>): Promise<SubcategoriaFinanceira> => {
    const res = await api.post('/api/financial/subcategorias/', data);
    return res.data;
};
export const updateSubcategoria = async (id: number, data: Partial<SubcategoriaFinanceira>): Promise<SubcategoriaFinanceira> => {
    const res = await api.put(`/api/financial/subcategorias/${id}/`, data);
    return res.data;
};
export const deleteSubcategoria = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/subcategorias/${id}/`);
};
export const subcategoriasQueryKey = ['subcategorias'] as const;

// ─── Clientes (lab) ───────────────────────────────────────────────────────────

export interface Cliente {
    id: number;
    tipo: 'convenio' | 'procedencia';
    nome: string;
    cnpj: string;
    endereco: string;
    email: string;
    telefone: string;
    data_de_recebimento?: string | null;
}

export const fetchClientes = async (): Promise<Cliente[] | PaginatedResponse<Cliente>> => {
    const res = await api.get('/api/lab/clientes/');
    return res.data;
};
export const createCliente = async (data: Partial<Cliente>): Promise<Cliente> => {
    const res = await api.post('/api/lab/clientes/', data);
    return res.data;
};
export const updateCliente = async (id: number, data: Partial<Cliente>): Promise<Cliente> => {
    const res = await api.put(`/api/lab/clientes/${id}/`, data);
    return res.data;
};
export const deleteCliente = async (id: number): Promise<void> => {
    await api.delete(`/api/lab/clientes/${id}/`);
};
export const clientesQueryKey = ['clientes'] as const;

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const parcelasQueryKey = ['parcelas'] as const;
export const contasPagarQueryKey = ['contasPagar'] as const;
export const contasReceberQueryKey = ['contasReceber'] as const;
export const contasBancariasQueryKey = ['contasBancarias'] as const;
export const centrosCustoQueryKey = ['centrosCusto'] as const;
export const centrosReceitaQueryKey = ['centrosReceita'] as const;
export const areasQueryKey = ['areas'] as const;
export const categoriasFinanceirasQueryKey = ['categoriasFinanceiras'] as const;
export const classificacoesFinanceirasQueryKey = ['classificacoesFinanceiras'] as const;
export const planoContasQueryKey = ['planoContas'] as const;
export const conciliacoesQueryKey = ['conciliacoes'] as const;
export const transferenciasQueryKey = ['transferencias'] as const;

export const fetchContasReceberAll = async (): Promise<ContaReceber[]> => {
    const all: ContaReceber[] = [];
    let page = 1;
    const maxPages = 50;
    while (page <= maxPages) {
        const res = await api.get('/api/financial/contas_receber/', { params: { page, page_size: 100 } });
        const data = res.data;
        const results: ContaReceber[] = Array.isArray(data) ? data : (data.results ?? []);
        all.push(...results);
        if (!data.next || Array.isArray(data)) break;
        page++;
    }
    return all;
};

export const fetchContasPagarAll = async (): Promise<ContaPagar[]> => {
    const all: ContaPagar[] = [];
    let page = 1;
    const maxPages = 50;
    while (page <= maxPages) {
        const res = await api.get('/api/financial/contas_pagar/', { params: { page, page_size: 100 } });
        const data = res.data;
        const results: ContaPagar[] = Array.isArray(data) ? data : (data.results ?? []);
        all.push(...results);
        if (!data.next || Array.isArray(data)) break;
        page++;
    }
    return all;
};

export const contasReceberAllQueryKey = ['contasReceberAll'] as const;
export const contasPagarAllQueryKey = ['contasPagarAll'] as const;

export interface RelatorioParams {
  tipo: 'contas-receber' | 'contas-pagar' | 'fluxo-caixa'
  tipo_data?: 'vencimento' | 'faturamento' | 'pagamento'
  filtro_tempo?: 'anual' | 'trimestral' | 'mensal' | 'diario' | 'personalizado'
  ano?: string
  trimestre?: string
  mes?: string
  dia?: string
  data_inicio?: string
  data_fim?: string
  cliente_id?: string
  beneficiario_id?: string
  conta_bancaria_id?: string
  classificacao_id?: string
  categoria_id?: string
  plano_contas_id?: string
  centro_id?: string
  status?: string
}

export interface RelatorioContaItem {
  id: number
  cliente_nome?: string
  fornecedor_nome?: string
  data_de_vencimento: string | null
  data_de_faturamento: string | null
  valor_total: number
  status: string
}

export interface RelatorioFluxoItem {
  data: string
  descricao: string
  tipo: 'entrada' | 'saida'
  valor: number
}

export const fetchRelatorio = async (params: RelatorioParams): Promise<RelatorioContaItem[] | RelatorioFluxoItem[]> => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
  const res = await api.get('/api/financial/relatorios/', { params: cleanParams })
  return res.data
}
