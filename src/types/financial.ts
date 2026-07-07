export interface ContaBancaria {
    id: number;
    unidade: number;
    codigo_banco: string;
    banco: string;
    agencia: string;
    numero_conta: string;
    tipo: string;
    saldo: number;
}

export interface ContasAReceber {
    id: number;
    data_de_lancamento: string;
    cliente: number;
    cliente_nome?: string;
    unidade: number;
    competencia?: string;
    documento_nf?: string;
    data_de_vencimento: string;
    status: string;
    historico_de_pagamento?: string;
    valor_pago?: number;
    valor: number;
}

export interface ContasAPagar {
    id: number;
    data_de_lancamento: string;
    fornecedor: number;
    fornecedor_nome?: string;
    unidade?: number;
    data_de_vencimento: string;
    status: string;
    valor: number;
    valor_pago?: number;
}
