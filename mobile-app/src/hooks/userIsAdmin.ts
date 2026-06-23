import { useAuth } from '../context/AuthContext';

export const useIsAdmin = (): boolean => {
  const { tipo } = useAuth();
  return tipo === 'admin';
};