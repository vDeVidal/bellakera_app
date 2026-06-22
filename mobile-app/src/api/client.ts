import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ⚠️ IMPORTANTE: Configura la IP correcta
// - Android emulador: 10.0.2.2
// - iOS simulador: localhost  
// - Dispositivo físico: IP local de tu PC (ej: 192.168.1.10)
const API_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: '10.0.2.2', // ⚠️ CAMBIA POR TU IP LOCAL
});

const BASE_URL = 'http://10.0.2.2:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.log('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);