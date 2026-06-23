import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// IP local de tu PC (solo se usa en dispositivo físico/web)
const LOCAL_IP = '192.168.1.XXX'; // <-- cámbiala si pruebas en celular real

const BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',     // emulador Android
  ios: 'http://localhost:3000/api',         // simulador iOS
  default: `http://${LOCAL_IP}:3000/api`,   // dispositivo físico / web
});

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

//  Alias para compatibilidad con código existente que importa `api`
export const api = apiClient;

// Interceptor: añadir el JWT a cada request automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de logs en desarrollo
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('❌ API Error:', {
      url: error?.config?.url,
      status: error?.response?.status,
      data: error?.response?.data,
    });
    return Promise.reject(error);
  },
  
);

// Helper: construye URL absoluta de una imagen del backend
export const buildImageUrl = (relativePath?: string | null): string | undefined => {
  if (!relativePath) return undefined;
  if (relativePath.startsWith('http')) return relativePath;
  const base = (apiClient.defaults.baseURL || '').replace('/api', '');
  return `${base}${relativePath}`;
};