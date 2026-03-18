import axios from "axios";
import { toast } from "@/hooks/use-toast";

// Default base URL fallback for local development if VITE_API_URL is not set
const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to attach access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ── Token refresh lock ────────────────────────────────────────────────────────
// Prevents concurrent 401s from each triggering an independent refresh request.
// With ROTATE_REFRESH_TOKENS=True, only the first refresh succeeds; the rest
// would use a blacklisted token and cause a redirect-to-login loop.
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

const notifyPending = (token: string) => {
    pendingRequests.forEach((cb) => cb(token));
    pendingRequests = [];
};

// Response interceptor to handle 401s and token refreshing
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Se o erro for 401 (Unauthorized) e ainda nao tentamos dar retry
        if (error.response?.status === 401 && !originalRequest._retry) {

            // Skip interceptor if the user is trying to login (not the refresh endpoint)
            if (originalRequest.url?.includes('/api/token/') && !originalRequest.url?.includes('refresh')) {
                return Promise.reject(error);
            }

            // Another refresh is already in flight — queue this request
            if (isRefreshing) {
                return new Promise((resolve) => {
                    pendingRequests.push((token: string) => {
                        originalRequest._retry = true;
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        resolve(api(originalRequest));
                    });
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) {
                    isRefreshing = false;
                    localStorage.removeItem("accessToken");
                    window.location.href = "/login";
                    return Promise.reject(error);
                }

                // Tenta obter um novo token de acesso usando o refresh token
                const response = await axios.post(`${BASE_URL}/api/token/refresh/`, {
                    refresh: refreshToken,
                });

                const newAccessToken = response.data.access;
                localStorage.setItem("accessToken", newAccessToken);

                // CRÍTICO: salva o novo refresh token quando ROTATE_REFRESH_TOKENS=True.
                // Sem isso, o token antigo fica na blacklist e o próximo refresh falha.
                if (response.data.refresh) {
                    localStorage.setItem("refreshToken", response.data.refresh);
                }

                isRefreshing = false;
                notifyPending(newAccessToken);

                // Atualiza o header da requisicao que falhou e tenta de novo
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                pendingRequests = [];
                // Se falhar o refresh (ex: token expirou mesmo), desloga e manda pro login
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        if (error.response?.status === 500) {
            toast({
                title: "Erro interno do servidor (500)",
                description: "Ocorreu um erro no servidor. Tente novamente mais tarde.",
                variant: "destructive"
            });
        } else if (error.response?.status === 404) {
            toast({
                title: "Recurso não encontrado (404)",
                description: "O item solicitado não foi encontrado no sistema.",
                variant: "destructive"
            });
        }

        return Promise.reject(error);
    }
);

export default api;
