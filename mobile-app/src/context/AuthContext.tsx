import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

interface Usuario {
  id: number;
  telefono: string;
  nombre?: string;
  apellido?: string;
  foto_perfil_url?: string;
}

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  login: (telefono: string, pin: string) => Promise<void>;
  logout: () => Promise<void>;
  guardarSesion: (token: string, user: Usuario) => Promise<void>;
  refrescarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSesion();
  }, []);

  const cargarSesion = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('usuario');
      if (token && userStr) {
        setUsuario(JSON.parse(userStr));
      }
    } catch (e) {
      console.log('Error cargando sesión:', e);
    } finally {
      setCargando(false);
    }
  };

  const guardarSesion = async (token: string, user: Usuario) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('usuario', JSON.stringify(user));
    setUsuario(user);
  };

  const login = async (telefono: string, pin: string) => {
    const { data } = await api.post('/auth/login', { telefono, pin });
    await guardarSesion(data.access_token, data.usuario);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario');
    setUsuario(null);
  };

  const refrescarUsuario = async () => {
    try {
      const { data } = await api.get('/usuarios/me');
      const userActualizado = {
        id: data.id_usuario,
        telefono: data.telefono,
        nombre: data.nombre,
        apellido: data.apellido,
        foto_perfil_url: data.foto_perfil_url,
      };
      await AsyncStorage.setItem('usuario', JSON.stringify(userActualizado));
      setUsuario(userActualizado);
    } catch (e) {
      console.log('Error refrescando usuario:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, guardarSesion, refrescarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);