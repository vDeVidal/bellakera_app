import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// IP local de tu PC (para dispositivo físico o iOS)
const LOCAL_IP = '192.168.18.6';

// Android Studio usa 10.0.2.2 para mapear el localhost de tu PC.
// Agregamos obligatoriamente el prefijo '/api' que tu main.ts define globalmente.
const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api'
  : `http://${LOCAL_IP}:3000/api`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Alias para compatibilidad con código existente que importa `api`
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
      method: error?.config?.method,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
    });
    return Promise.reject(error);
  },
);

// Helper: construye URL absoluta de una imagen del backend
export const buildImageUrl = (relativePath?: string | null): string | undefined => {
  if (!relativePath) return undefined;
  if (relativePath.startsWith('http')) return relativePath;
  // Quitamos el '/api' para apuntar correctamente a la carpeta estática '/uploads'
  const base = (apiClient.defaults.baseURL || '').replace('/api', '');
  return `${base}${relativePath}`;
};