import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

// Tipos de cuenta
export type TipoCuenta = 'usuario' | 'admin';
export type RolAdmin = 'SUPER_ADMIN' | 'CAJA' | 'PUERTA';

// Interfaz de Usuario (acepta tanto usuario normal como admin)
export interface Usuario {
  id_usuario?: number;
  id_admin?: number;
  telefono: string;
  nombre?: string;
  apellido?: string;
  fecha_nacimiento?: string;
  estado?: string;
  verificado?: boolean;
  rol?: RolAdmin; // Solo presente para admins
}

interface AuthContextProps {
  usuario: Usuario | null;
  tipo: TipoCuenta | null;
  token: string | null;
  cargando: boolean;
  login: (telefono: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  guardarSesion: (data: { access_token: string; tipo: TipoCuenta; usuario: Usuario }) => Promise<void>;
  refrescarUsuario: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

interface Props {
  children: ReactNode;
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [tipo, setTipo] = useState<TipoCuenta | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Cargar sesión guardada al iniciar
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const tokenGuardado = await AsyncStorage.getItem('token');
        const usuarioGuardado = await AsyncStorage.getItem('usuario');
        const tipoGuardado = await AsyncStorage.getItem('tipo');

        if (tokenGuardado && usuarioGuardado && tipoGuardado) {
          setToken(tokenGuardado);
          setUsuario(JSON.parse(usuarioGuardado));
          setTipo(tipoGuardado as TipoCuenta);
        }
      } catch (error) {
        console.log('Error cargando sesión:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarSesion();
  }, []);

  const guardarSesion = async (data: { access_token: string; tipo: TipoCuenta; usuario: Usuario }) => {
    try {
      await AsyncStorage.setItem('token', data.access_token);
      await AsyncStorage.setItem('usuario', JSON.stringify(data.usuario));
      await AsyncStorage.setItem('tipo', data.tipo);

      setToken(data.access_token);
      setUsuario(data.usuario);
      setTipo(data.tipo);
    } catch (error) {
      console.log('Error guardando sesión:', error);
      throw error;
    }
  };

  const login = async (telefono: string, pin: string) => {
    try {
      const response = await apiClient.post('/auth/login', { telefono, pin });
      const data = response.data;

      if (!data.access_token) {
        throw new Error('No se recibió token del servidor');
      }

      await guardarSesion({
        access_token: data.access_token,
        tipo: data.tipo,
        usuario: data.usuario,
      });
    } catch (error: any) {
      console.log('Error en login:', error?.response?.data || error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('usuario');
      await AsyncStorage.removeItem('tipo');
      setToken(null);
      setUsuario(null);
      setTipo(null);
    } catch (error) {
      console.log('Error cerrando sesión:', error);
    }
  };

  const refrescarUsuario = async () => {
    try {
      if (!token) return;
      const response = await apiClient.get('/auth/me');
      const usuarioActualizado = response.data;
      setUsuario(usuarioActualizado);
      await AsyncStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
    } catch (error) {
      console.log('Error refrescando usuario:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        tipo,
        token,
        cargando,
        login,
        logout,
        guardarSesion,
        refrescarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// 🪝 HOOK PERSONALIZADO useAuth
// ============================================
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};