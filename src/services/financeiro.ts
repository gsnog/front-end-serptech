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
}

export interface ContaPagar {
    id: number;
    beneficiario?: number;
    fornecedor_nome?: string;
    documento?: string;
    valor_do_titulo?: number;
    valor_total?: number;
    data_de_lancamento?: string;
    data_de_faturamento?: string;
    data_de_vencimento?: string;
    status?: string;
}

export interface ContaReceber {
    id: number;
    cliente?: number;
    cliente_nome?: string;
    documento?: string;
    valor_do_titulo?: number;
    valor_total?: number;
    data_de_lancamento?: string;
    data_de_faturamento?: string;
    data_de_vencimento?: string;
    status?: string;
}

export interface ContaBancaria {
    id: number;
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

export const fetchEstatisticasFinanceiras = async (): Promise<EstatisticasFinanceiras> => {
    const res = await api.get('/api/financial/estatisticas/');
    return res.data;
};

export const fetchDashboardFull = async (): Promise<any> => {
    const res = await api.get('/api/dashboard-full/');
    return res.data;
};

// ─── Parcelas ─────────────────────────────────────────────────────────────────

export const fetchParcelas = async (page?: number): Promise<Parcela[] | PaginatedResponse<Parcela>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/financial/parcelas/', { params });
    return res.data;
};

// ─── Contas a Pagar ───────────────────────────────────────────────────────────

export const fetchContasPagar = async (page?: number): Promise<ContaPagar[] | PaginatedResponse<ContaPagar>> => {
    const params = page !== undefined ? { page } : {};
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
export const deleteContaPagar = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/contas_pagar/${id}/`);
};

// ─── Contas a Receber ─────────────────────────────────────────────────────────

export const fetchContasReceber = async (page?: number): Promise<ContaReceber[] | PaginatedResponse<ContaReceber>> => {
    const params = page !== undefined ? { page } : {};
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

// ─── Conta Bancária ───────────────────────────────────────────────────────────

export const fetchContasBancarias = async (page?: number): Promise<ContaBancaria[] | PaginatedResponse<ContaBancaria>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/financial/contas_bancarias/', { params });
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

export const fetchCentrosCusto = async (page?: number): Promise<CentroCusto[] | PaginatedResponse<CentroCusto>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/financial/centro-custo/', { params });
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

export const fetchCentrosReceita = async (page?: number): Promise<CentroReceita[] | PaginatedResponse<CentroReceita>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/financial/centro-receita/', { params });
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

export const fetchCategoriasFinanceiras = async (page?: number): Promise<CategoriaFinanceira[] | PaginatedResponse<CategoriaFinanceira>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/financial/categorias/', { params });
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

export const fetchPlanoContas = async (page?: number): Promise<PlanoContas[] | PaginatedResponse<PlanoContas>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/financial/plano-contas/', { params });
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
    const res = await api.get(`/api/financial/conciliacao/${id}/conciliar/`);
    return res.data;
};

export const efetivarConciliacaoBancaria = async (
    conciliacaoId: number,
    payload: { conta_tipo: 'receber' | 'pagar'; conta_id: number }
): Promise<any> => {
    const res = await api.post(`/api/financial/conciliacao/${conciliacaoId}/conciliar/efetivar/`, payload);
    return res.data;
};
export const deleteConciliacao = async (id: number): Promise<void> => {
    await api.delete(`/api/financial/conciliacoes/${id}/`);
};

// ─── Transferências ───────────────────────────────────────────────────────────

export const fetchTransferencias = async (page?: number): Promise<Transacao[] | PaginatedResponse<Transacao>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/financial/transferencias/', { params });
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
