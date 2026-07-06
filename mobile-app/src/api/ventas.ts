import { apiClient } from './client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface VentaDetalle {
  id: number;
  venta_id: number;
  producto_id: number | null;
  nombre_snapshot: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  estado: string;
  notas: string | null;
}

export interface Venta {
  id: number;
  usuario_id: number;
  evento_id: number;
  tipo_venta: 'ENTRADA' | 'BEBIDA';
  estado: 'pendiente' | 'pagado' | 'preparando' | 'listo' | 'entregado' | 'cancelado';
  total: number;
  metodo_pago: string | null;
  notas: string | null;
  qr_code: string | null;
  qr_escaneado: boolean;
  fecha: string;
  fecha_entrega: string | null;
  usuario?: { id: number; nombre: string; telefono: string };
  evento?: { id: number; nombre: string; fecha: string };
  detalles: VentaDetalle[];
}

export interface ItemVenta {
  producto_id?: number;
  cantidad: number;
  notas?: string;
}

export interface CreateVentaDto {
  evento_id: number;
  tipo_venta: 'ENTRADA' | 'BEBIDA';
  items: ItemVenta[];
  metodo_pago?: string;
  notas?: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const ventasApi = {
  /** Crear una nueva venta (entrada o bebida) */
  crear: async (dto: CreateVentaDto): Promise<Venta> => {
    const { data } = await apiClient.post<Venta>('/ventas', dto);
    return data;
  },

  /** Obtener mis ventas (del usuario autenticado) */
  misVentas: async (): Promise<Venta[]> => {
    const { data } = await apiClient.get<Venta[]>('/ventas/mis-ventas');
    return data;
  },
};
