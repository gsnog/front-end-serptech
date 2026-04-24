import api, { type PaginatedResponse } from '@/lib/api';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface Fornecedor {
    id: number;
    nome: string;
    cnpj?: string;
    cpf?: string;
    razao_social?: string;
    endereco?: string;
    vendedor?: string;
    email?: string;
    telefone?: string;
}

export interface ItemEstoque {
    id: number;
    itens_do_estoque: string;
}

export interface InventarioItem {
    id: number;
    item: number;
    item_nome: string;
    unidade: number;
    unidade_nome: string;
    quantidade_disponivel: number;
}

export interface Locacao {
    id: number;
    locador: number;
    locador_nome: string;
    data_inicio: string;
    previsao_de_entrega: string;
    data_fim: string | null;
    valor: number;
    adicional: number;
    desconto: number;
    valor_total: number;
    status: string;
    unidade: number;
    unidade_nome: string;
    descricao: string;
}

export interface OrdemCompra {
    id: number;
    data?: string;
    data_de_entrega?: string | null;
    data_de_compra?: string | null;
    setor?: number;
    setor_nome?: string;
    unidade?: number;
    unidade_nome?: string;
    descricao_material?: string;
    justificativa?: string;
    status?: string;
    status_da_compra?: string;
    feedback?: string | null;
    itens?: OrdemCompraItem[];
    gestor?: number | null;
}

export interface OrdemCompraItem {
    id: number;
    ordem_de_compra: number;
    item: string;
    marca?: string;
    quantidade: number;
    especificacoes?: string;
}

export interface OrdemServicoFilhoGerais {
    id: number;
    unidade: number;
    unidade_nome?: string;
    setor: number;
    setor_nome?: string;
    tipo_servico: string;
}

export interface OrdemServicoFilhoImobilizado {
    id: number;
    patrimonio: number;
    patrimonio_codigo?: string;
    tipo_servico: string;
}

export interface OrdemServicoFilhoSuporte {
    id: number;
    tipo_suporte: string;
    software?: number | null;
    software_nome?: string | null;
}

export interface OrdemServico {
    id: number;
    numero?: number;
    data_solicitacao?: string;
    data_de_resolucao?: string;
    tipo_de_ordem?: string;
    descricao?: string;
    fornecedor?: number;
    fornecedor_nome?: string;
    feedback?: string;
    status?: string;
    usuario_nome?: string;
    user?: number | null;
    filho_servicos_gerais?: OrdemServicoFilhoGerais[];
    filho_imobilizado?: OrdemServicoFilhoImobilizado[];
    filho_suporte?: OrdemServicoFilhoSuporte[];
    finalizado_por?: number | null;
    finalizado_por_nome?: string | null;
}

export interface RequisicaoSetor {
    id: number;
    data?: string;
    unidade?: number;
    unidade_nome?: string;
    setor_requisicao?: number;
    setor_nome?: string;
    requisitante_nome?: string;
    status?: string;
    status_entrega?: string;
    observacao?: string;
    itens?: RequisicaoItem[];
    user_create?: number | null;
}

export interface RequisicaoItem {
    id: number;
    requisicao: number;
    item?: number;
    item_nome?: string;
    quantidade: number;
    quantidade_aprovada?: number;
}

export interface Patrimonio {
    id: number;
    item?: number;
    item_nome?: string;
    data_de_aquisicao?: string;
    valor?: number;
    unidade?: number;
    unidade_nome?: string;
    descricao?: string;
    codigo?: string;
}

export interface NotaFiscal {
    id: number;
    numero: string;
    xml_arquivo?: string;
    pdf_arquivo?: string;
    valor_total?: number;
    data_emissao: string;
}

export interface Setor {
    id: number;
    setor: string;
}

export interface Unidade {
    id: number;
    unidade: string;
    cnpj?: string;
    estado?: string;
    cidade?: string;
}

export interface FormaApresentacao {
    id: number;
    forma_apresentacao: string;
    item: number | null;
    item_nome?: string;
    nomenclatura: number | null;
    nomenclatura_nome?: string;
    fornecedor: number | null;
    fornecedor_nome?: string;
    fator_conversao: string;
}

export interface ItemSaida {
    id: number;
    saida_estoque: number;
    item: number;
    item_nome: string;
    quantidade: number;
}

export interface Saida {
    id: number;
    data: string;
    setor_destino: number;
    setor_destino_nome?: string;
    estoque_origem: number;
    estoque_origem_nome?: string;
    observacao?: string;
    requisicao?: number | null;
    user_create?: number;
    criado_por_nome?: string;
    itens: ItemSaida[];
}

// ─── Fornecedores ─────────────────────────────────────────────────────────────

export const fetchFornecedores = async (page?: number, search?: string): Promise<Fornecedor[] | PaginatedResponse<Fornecedor>> => {
    const params: Record<string, unknown> = {};
    if (page !== undefined) params.page = page;
    if (search) params.search = search;
    const res = await api.get('/api/estoque/fornecedores/', { params });
    return res.data;
};
export const createFornecedor = async (data: Partial<Fornecedor>): Promise<Fornecedor> => {
    const res = await api.post('/api/estoque/fornecedores/', data);
    return res.data;
};
export const updateFornecedor = async (id: number, data: Partial<Fornecedor>): Promise<Fornecedor> => {
    const res = await api.put(`/api/estoque/fornecedores/${id}/`, data);
    return res.data;
};
export const deleteFornecedor = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/fornecedores/${id}/`);
};

// ─── Itens ────────────────────────────────────────────────────────────────────

export const fetchItensEstoque = async (page?: number): Promise<ItemEstoque[] | PaginatedResponse<ItemEstoque>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/estoque/itens/', { params });
    return res.data;
};

// ─── Inventário ───────────────────────────────────────────────────────────────

export const fetchInventario = async (page?: number): Promise<InventarioItem[] | PaginatedResponse<InventarioItem>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/estoque/inventario/', { params });
    return res.data;
};
export const createInventarioItem = async (data: Partial<InventarioItem>): Promise<InventarioItem> => {
    const res = await api.post('/api/estoque/inventario/', data);
    return res.data;
};
export const updateInventarioItem = async (id: number, data: Partial<InventarioItem>): Promise<InventarioItem> => {
    const res = await api.put(`/api/estoque/inventario/${id}/`, data);
    return res.data;
};
export const deleteInventarioItem = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/inventario/${id}/`);
};

// ─── Locações ─────────────────────────────────────────────────────────────────

export const fetchLocacoes = async (page?: number): Promise<Locacao[] | PaginatedResponse<Locacao>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/estoque/locacoes/', { params });
    return res.data;
};

// ─── Ordens de Compra ─────────────────────────────────────────────────────────

export const fetchOrdensCompra = async (page = 1): Promise<PaginatedResponse<OrdemCompra>> => {
    const res = await api.get('/api/estoque/ordens-compra/', { params: { page, page_size: 20 } });
    return res.data;
};
export const fetchOrdemCompra = async (id: number): Promise<OrdemCompra> => {
    const res = await api.get(`/api/estoque/ordens-compra/${id}/`);
    return res.data;
};
export const createOrdemCompra = async (data: Partial<OrdemCompra>): Promise<OrdemCompra> => {
    const res = await api.post('/api/estoque/ordens-compra/', data);
    return res.data;
};
export const updateOrdemCompra = async (id: number, data: Partial<OrdemCompra>): Promise<OrdemCompra> => {
    const res = await api.put(`/api/estoque/ordens-compra/${id}/`, data);
    return res.data;
};
export const deleteOrdemCompra = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/ordens-compra/${id}/`);
};
export const aprovarOrdemCompra = async (id: number): Promise<OrdemCompra> => {
    const res = await api.post(`/api/estoque/ordens-compra/${id}/aprovar/`);
    return res.data;
};
export const negarOrdemCompra = async (id: number, feedback?: string): Promise<OrdemCompra> => {
    const res = await api.post(`/api/estoque/ordens-compra/${id}/negar/`, { feedback });
    return res.data;
};
export const registrarCompraOrdem = async (id: number): Promise<OrdemCompra> => {
    const res = await api.post(`/api/estoque/ordens-compra/${id}/registrar_compra/`);
    return res.data;
};
export const registrarEntregaOrdem = async (id: number): Promise<OrdemCompra> => {
    const res = await api.post(`/api/estoque/ordens-compra/${id}/registrar_entrega/`);
    return res.data;
};

// ─── Ordens de Serviço ────────────────────────────────────────────────────────

export const fetchOrdensServico = async (page = 1): Promise<PaginatedResponse<OrdemServico>> => {
    const res = await api.get('/api/estoque/ordens-servico/', { params: { page, page_size: 20 } });
    return res.data;
};
export const fetchOrdemServico = async (id: number): Promise<OrdemServico> => {
    const res = await api.get(`/api/estoque/ordens-servico/${id}/`);
    return res.data;
};
export const createOrdemServico = async (data: Partial<OrdemServico>): Promise<OrdemServico> => {
    const res = await api.post('/api/estoque/ordens-servico/', data);
    return res.data;
};
export const updateOrdemServico = async (id: number, data: Partial<OrdemServico>): Promise<OrdemServico> => {
    const res = await api.put(`/api/estoque/ordens-servico/${id}/`, data);
    return res.data;
};
export const deleteOrdemServico = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/ordens-servico/${id}/`);
};

export interface Software {
    id: number;
    nome: string;
    fornecedor: number;
    fornecedor_nome?: string;
    licenca?: string | null;
    data_aquisicao?: string;
    data_vencimento?: string | null;
    valor?: number;
}

export const fetchSoftware = async (): Promise<Software[]> => {
    const res = await api.get('/api/estoque/software/');
    return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};
export const createSoftware = async (data: Partial<Software>): Promise<Software> => {
    const res = await api.post('/api/estoque/software/', data);
    return res.data;
};
export const updateSoftware = async (id: number, data: Partial<Software>): Promise<Software> => {
    const res = await api.put(`/api/estoque/software/${id}/`, data);
    return res.data;
};
export const deleteSoftware = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/software/${id}/`);
};
export const softwareQueryKey = ['software'] as const;

// ─── Requisições de Setor ─────────────────────────────────────────────────────

export const fetchRequisicoes = async (page?: number): Promise<RequisicaoSetor[] | PaginatedResponse<RequisicaoSetor>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/estoque/requisicoes/', { params });
    return res.data;
};
export const createRequisicao = async (data: Partial<RequisicaoSetor>): Promise<RequisicaoSetor> => {
    const res = await api.post('/api/estoque/requisicoes/', data);
    return res.data;
};
export const updateRequisicao = async (id: number, data: Partial<RequisicaoSetor>): Promise<RequisicaoSetor> => {
    const res = await api.patch(`/api/estoque/requisicoes/${id}/`, data);
    return res.data;
};
export const aprovarRequisicao = async (id: number, itens: { id: number; quantidade_aprovada: number }[]): Promise<RequisicaoSetor> => {
    const res = await api.post(`/api/estoque/requisicoes/${id}/aprovar/`, { itens });
    return res.data;
};
export const negarRequisicao = async (id: number, observacao: string): Promise<RequisicaoSetor> => {
    const res = await api.post(`/api/estoque/requisicoes/${id}/negar/`, { observacao });
    return res.data;
};
export const entregarRequisicao = async (id: number): Promise<RequisicaoSetor> => {
    const res = await api.post(`/api/estoque/requisicoes/${id}/entregar/`);
    return res.data;
};
export const deleteRequisicao = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/requisicoes/${id}/`);
};

// ─── Patrimônio ───────────────────────────────────────────────────────────────

export const fetchPatrimonio = async (page?: number): Promise<Patrimonio[] | PaginatedResponse<Patrimonio>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/estoque/patrimonio/', { params });
    return res.data;
};
export const createPatrimonio = async (data: Partial<Patrimonio>): Promise<Patrimonio> => {
    const res = await api.post('/api/estoque/patrimonio/', data);
    return res.data;
};
export const updatePatrimonio = async (id: number, data: Partial<Patrimonio>): Promise<Patrimonio> => {
    const res = await api.put(`/api/estoque/patrimonio/${id}/`, data);
    return res.data;
};
export const deletePatrimonio = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/patrimonio/${id}/`);
};

// ─── Notas Fiscais ─────────────────────────────────────────────────────────────

export const fetchNotasFiscais = async (page?: number): Promise<NotaFiscal[] | PaginatedResponse<NotaFiscal>> => {
    const params = page !== undefined ? { page } : {};
    const res = await api.get('/api/estoque/notas-fiscais/', { params });
    return res.data;
};
export const deleteNotaFiscal = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/notas-fiscais/${id}/`);
};

// ─── Entradas ─────────────────────────────────────────────────────────────────

export const fetchEntradas = async (page = 1): Promise<PaginatedResponse<any>> => {
    const res = await api.get('/api/estoque/entradas/', { params: { page, page_size: 20 } });
    return res.data;
};

export const fetchAllEntradas = async (): Promise<any[]> => {
    const all: any[] = [];
    let page = 1;
    while (true) {
        const res = await api.get('/api/estoque/entradas/', { params: { page, page_size: 100 } });
        const data: PaginatedResponse<any> = res.data;
        all.push(...(data.results ?? []));
        if (!data.next) break;
        page++;
    }
    return all;
};

export const entradasQueryKey = ['entradas_estoque'] as const;

// ─── Transferências ─────────────────────────────────────────────────────────────

export const createTransferencia = async (data: any): Promise<any> => {
    const res = await api.post('/api/estoque/transferencias/', data);
    return res.data;
};

// ─── Saídas ───────────────────────────────────────────────────────────────────

export const fetchSaidas = async (page = 1): Promise<PaginatedResponse<Saida>> => {
    const res = await api.get('/api/estoque/saidas/', { params: { page, page_size: 20 } });
    return res.data;
};
export const createSaida = async (data: Partial<Saida> & { itens: any[] }): Promise<Saida> => {
    const res = await api.post('/api/estoque/saidas/', data);
    return res.data;
};
export const deleteSaida = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/saidas/${id}/`);
};

// ─── Setores ──────────────────────────────────────────────────────────────────

export const fetchSetoresEstoque = async (): Promise<Setor[]> => {
    const res = await api.get('/api/setores-estoque/');
    return res.data;
};
export const createSetorEstoque = async (data: Partial<Setor>): Promise<Setor> => {
    const res = await api.post('/api/setores-estoque/', data);
    return res.data;
};
export const updateSetorEstoque = async (id: number, data: Partial<Setor>): Promise<Setor> => {
    const res = await api.put(`/api/setores-estoque/${id}/`, data);
    return res.data;
};
export const deleteSetorEstoque = async (id: number): Promise<void> => {
    await api.delete(`/api/setores-estoque/${id}/`);
};

// ─── Unidades ─────────────────────────────────────────────────────────────────

export const fetchUnidades = async (): Promise<Unidade[]> => {
    const res = await api.get('/api/estoque/unidades/');
    return res.data;
};
export const createUnidade = async (data: Partial<Unidade>): Promise<Unidade> => {
    const res = await api.post('/api/estoque/unidades/', data);
    return res.data;
};
export const updateUnidade = async (id: number, data: Partial<Unidade>): Promise<Unidade> => {
    const res = await api.put(`/api/estoque/unidades/${id}/`, data);
    return res.data;
};
export const deleteUnidade = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/unidades/${id}/`);
};

// ─── Formas de Apresentação ───────────────────────────────────────────────────

export const fetchFormasApresentacao = async (): Promise<FormaApresentacao[]> => {
    const res = await api.get('/api/estoque/formas-apresentacao/');
    return res.data;
};
export const createFormaApresentacao = async (data: Partial<FormaApresentacao>): Promise<FormaApresentacao> => {
    const res = await api.post('/api/estoque/formas-apresentacao/', data);
    return res.data;
};
export const updateFormaApresentacao = async (id: number, data: Partial<FormaApresentacao>): Promise<FormaApresentacao> => {
    const res = await api.put(`/api/estoque/formas-apresentacao/${id}/`, data);
    return res.data;
};
export const deleteFormaApresentacao = async (id: number): Promise<void> => {
    await api.delete(`/api/estoque/formas-apresentacao/${id}/`);
};

// ─── Nomenclaturas ─────────────────────────────────────────────────────────────

export interface Nomenclatura {
    id: number;
    nome: string;
}

export const fetchNomenclaturas = async (): Promise<Nomenclatura[]> => {
    const res = await api.get('/api/estoque/nomenclaturas/');
    return Array.isArray(res.data) ? res.data : res.data?.results ?? [];
};

export const createNomenclatura = async (nome: string): Promise<Nomenclatura> => {
    const res = await api.post('/api/estoque/nomenclaturas/', { nome });
    return res.data;
};

// ─── Query Keys ───────────────────────────────────────────────────────────────
export const nomenclaturasQueryKey = ['nomenclaturas'] as const;
export const fornecedoresQueryKey = ['fornecedores'] as const;
export const itensEstoqueQueryKey = ['itensEstoque'] as const;
export const inventarioQueryKey = ['inventario'] as const;
export const locacoesQueryKey = ['locacoes'] as const;
export const ordensCompraQueryKey = ['ordensCompra'] as const;
export const ordensServicoQueryKey = ['ordensServico'] as const;
export const requisicoesQueryKey = ['requisicoes'] as const;
export const patrimonioQueryKey = ['patrimonio'] as const;
export const notasFiscaisQueryKey = ['notasFiscais'] as const;
export const setoresEstoqueQueryKey = ['setoresEstoque'] as const;
export const unidadesQueryKey = ['unidades'] as const;
export const formasApresentacaoQueryKey = ['formasApresentacao'] as const;
export const saidasQueryKey = ['saidas'] as const;
