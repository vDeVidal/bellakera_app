import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/api/client';

export interface AdminUser {
    id_admin: number;
    telefono: string;
    nombre: string;
    apellido: string;
    rol: 'SUPER_ADMIN' | 'CAJA' | 'PUERTA';
    activo: boolean;
}

interface AuthState {
    token: string | null;
    user: AdminUser | null;
    loading: boolean;
    login: (telefono: string, pin: string) => Promise<void>;
    logout: () => void;
    fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            loading: false,

            login: async (telefono, pin) => {
                set({ loading: true });
                try {
                    const { data } = await api.post('/auth/login', { telefono, pin });

                    if (data.tipo !== 'admin') {
                        throw new Error('Esta cuenta no tiene permisos de administrador');
                    }

                    localStorage.setItem('bellakera_token', data.access_token);
                    set({
                        token: data.access_token,
                        user: data.usuario,
                        loading: false,
                    });
                } catch (err) {
                    set({ loading: false });
                    throw err;
                }
            },

            logout: () => {
                localStorage.removeItem('bellakera_token');
                localStorage.removeItem('bellakera_user');
                set({ token: null, user: null });
            },

            fetchMe: async () => {
                try {
                    const { data } = await api.get('/auth/me');
                    if (data.tipo === 'admin') {
                        set({ user: data.usuario });
                    } else {
                        get().logout();
                    }
                } catch {
                    get().logout();
                }
            },
        }),
        {
            name: 'bellakera_auth',
            partialize: (state) => ({ token: state.token, user: state.user }),
        },
    ),
);