import api from '@/lib/api';

export interface Notificacao {
    id: number;
    titulo: string;
    mensagem: string;
    tipo: 'alerta' | 'estoque' | 'financeiro' | 'documento';
    lida: boolean;
    criado_em: string;
}

export const fetchNotificacoes = async (): Promise<Notificacao[]> => {
    const res = await api.get('/api/notificacoes/');
    return res.data;
};

export const marcarLida = async (id: number): Promise<void> => {
    await api.post(`/api/notificacoes/${id}/marcar_lida/`);
};

export const marcarTodasLidas = async (): Promise<void> => {
    await api.post('/api/notificacoes/marcar_todas_lidas/');
};

export const limparTodasNotificacoes = async (): Promise<void> => {
    await api.post('/api/notificacoes/limpar_todas/');
};
