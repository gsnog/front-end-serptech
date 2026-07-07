/**
 * Singleton WebSocket Manager for strictly managing realtime connections.
 * This class handles auto-reconnection and prevents zombie connections 
 * (memory leaks) during HMR or strict rendering.
 */

export type MessageHandler = (data: any) => void;

class SocketManager {
    private socket: WebSocket | null = null;
    private url: string;
    private handlers: Map<string, Set<MessageHandler>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private stableTimeout: NodeJS.Timeout | null = null;
    private isConnecting = false;

    constructor(url: string) {
        this.url = url;
    }

    public connect(): void {
        if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
            return;
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.error('[Socket] Cannot connect without token');
            return;
        }

        this.isConnecting = true;
        const authUrl = this.url.includes('?') ? `${this.url}&token=${token}` : `${this.url}?token=${token}`;

        try {
            this.socket = new WebSocket(authUrl);

            this.socket.onopen = () => {
                console.log(`[Socket] Connected to ${this.url}`);
                this.isConnecting = false;
                // Só reseta tentativas após 5s estável — evita loop quando
                // o servidor aceita a conexão mas a fecha imediatamente
                this.stableTimeout = setTimeout(() => {
                    this.reconnectAttempts = 0;
                }, 5000);
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    // the Django backend sends an object with "type" and we map it to "action" 
                    // or use the root object if no type is found safely
                    const type = data.type || 'message';

                    const typeHandlers = this.handlers.get(type) || this.handlers.get('all');

                    if (typeHandlers) {
                        typeHandlers.forEach(handler => handler(data));
                    }
                } catch (error) {
                    console.error('[Socket] Failed to parse message', error);
                }
            };

            this.socket.onclose = () => {
                console.log(`[Socket] Disconnected from ${this.url}`);
                if (this.stableTimeout) clearTimeout(this.stableTimeout);
                this.isConnecting = false;
                this.socket = null;
                this.handleReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('[Socket] Error on socket:', this.url, error);
            };
        } catch (e) {
            this.isConnecting = false;
            this.handleReconnect();
        }
    }

    private handleReconnect() {
        if (!localStorage.getItem('accessToken')) {
            return; // Do not reconnect after logout
        }
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            this.reconnectAttempts++;

            console.log(`[Socket] Reconnecting in ${timeout}ms (Attempt ${this.reconnectAttempts})`);

            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }

            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, timeout);
        }
    }

    public disconnect(): void {
        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
        if (this.stableTimeout) clearTimeout(this.stableTimeout);
        this.reconnectAttempts = this.maxReconnectAttempts;

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    public send(payload: any): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(payload));
        } else {
            console.error('[Socket] Cannot send message, socket is not connected');
        }
    }

    public subscribe(type: string, handler: MessageHandler): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }

        this.handlers.get(type)!.add(handler);

        // Return unsubscribe function
        return () => {
            const typeHandlers = this.handlers.get(type);
            if (typeHandlers) {
                typeHandlers.delete(handler);
                if (typeHandlers.size === 0) {
                    this.handlers.delete(type);
                }
            }
        };
    }
}

// Deriva a URL base do WebSocket a partir de VITE_API_URL
// http://... → ws://...   |   https://... → wss://...
const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const WS_BASE = apiUrl.replace(/^http/, 'ws');

// Global instances exposed
export const chatSocket = new SocketManager(`${WS_BASE}/ws/chat/`);
export const rtcSocket = new SocketManager(`${WS_BASE}/ws/signaling/`);
/** General-purpose data updates channel — broadcasts model create/update/delete events. */
export const updatesSocket = new SocketManager(`${WS_BASE}/ws/updates/`);
