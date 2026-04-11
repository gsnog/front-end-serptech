export interface Nomenclatura {
    id: number;
    nome: string;
}

export interface Item {
    id: number;
    itens_do_estoque: string;
    descricao?: string;
    saldo_disponivel?: number;
    unidade_medida?: string;
    frequencia_compra?: string;
    frequencia_de_saida?: string;
}

export interface Fornecedor {
    id: number;
    nome: string;
    cnpj?: string;
    cpf?: string;
    razao_social: string;
    telefone?: string;
    email?: string;
}

export interface Entradas {
    id: number;
    // Legacy fields (kept for backward compat with old serializer/data)
    numeracao_nf?: string;
    ordem_de_compra?: string;
    data_de_chegada?: string;
    // Canonical fields (aligned with backend EntradasSerializer)
    data?: string;
    nota_fiscal?: string;
    fornecedor: number | null;
    fornecedor_nome?: string | null;
    quantidade?: number;
    custo_unitario?: number;
    custo_total?: number | null;
    obs?: string | null;
    // Approval workflow (server-controlled — read-only on frontend)
    status?: 'pendente' | 'aprovado' | 'recusado';
    tipo?: 'compra' | 'producao_local';
    criado_por?: number | null;
    criado_por_nome?: string | null;
    aprovado_por?: number | null;
    aprovado_por_nome?: string | null;
    aprovado_em?: string | null;
    insumos?: InsumoProducao[];
}

export interface InsumoProducao {
    id: number;
    entrada_estoque: number;
    item: number;
    item_nome?: string;
    quantidade: number;
    estoque_origem?: number | null;
    estoque_origem_nome?: string | null;
}

export interface ItemEntradaEstoque {
    id: number;
    entrada: number;
    item: number;
    item_nome?: string;
    quantidade: number;
    valor_unidade?: number;
    valor_total?: number;
}

export interface Saidas {
    id: number;
    item: number;
    item_nome?: string;
    quantidade: number;
    requisitante?: number;
    requisitante_nome?: string;
    data_de_saida: string;
    motivo?: string;
}
