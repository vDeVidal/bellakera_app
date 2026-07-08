import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('bellakera_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error?.response?.status === 401) {
            localStorage.removeItem('bellakera_token');
            localStorage.removeItem('bellakera_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    },
);

export const buildImageUrl = (path?: string | null): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    // Ruta relativa (/uploads/...) → el proxy de Vite la redirige al backend
    if (path.startsWith('/')) return path;
    return `${API_URL}${path}`;
};

// Alias para compatibilidad con nuevo código (Fase 3+)
export const apiClient = api;