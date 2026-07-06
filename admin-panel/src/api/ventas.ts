import { apiClient } from "./client"

export interface VentaDetalle {
    id: number
    venta_id: number
    producto_id: number | null
    nombre_snapshot: string
    cantidad: number
    precio_unitario: number
    subtotal: number
    estado: string
    notas: string | null
    producto?: {
        id: number
        nombre: string
        imagen_url: string | null
    } | null
}

export interface Venta {
    id: number
    usuario_id: number
    evento_id: number
    admin_id: number | null
    tipo_venta: "ENTRADA" | "BEBIDA"
    estado: "pendiente" | "pagado" | "preparando" | "listo" | "entregado" | "cancelado"
    total: number
    metodo_pago: string | null
    notas: string | null
    qr_code: string | null
    qr_escaneado: boolean
    fecha: string
    fecha_entrega: string | null
    usuario: {
        id: number
        nombre: string
        telefono: string
    }
    evento?: {
        id: number
        nombre: string
        fecha: string
    }
    detalles: VentaDetalle[]
}

export interface VentaListFilters {
    eventoId?: number
    estado?: string
    tipo?: string
}

export const ventasApi = {
    list: async (filters: VentaListFilters = {}): Promise<Venta[]> => {
        const params = new URLSearchParams()
        if (filters.eventoId) params.append("eventoId", String(filters.eventoId))
        if (filters.estado && filters.estado !== "Todos") params.append("estado", filters.estado)
        if (filters.tipo && filters.tipo !== "Todos") params.append("tipo", filters.tipo)

        const queryStr = params.toString()
        const url = queryStr ? `/ventas?${queryStr}` : "/ventas"
        
        const { data } = await apiClient.get<Venta[]>(url)
        return data
    },

    getCola: async (eventoId?: number): Promise<Venta[]> => {
        const url = eventoId ? `/ventas/cola?eventoId=${eventoId}` : "/ventas/cola"
        const { data } = await apiClient.get<Venta[]>(url)
        return data
    },

    get: async (id: number): Promise<Venta> => {
        const { data } = await apiClient.get<Venta>(`/ventas/${id}`)
        return data
    },

    updateEstado: async (id: number, estado: string): Promise<Venta> => {
        const { data } = await apiClient.patch<Venta>(`/ventas/${id}/estado`, { estado })
        return data
    },

    cancelar: async (id: number): Promise<Venta> => {
        const { data } = await apiClient.patch<Venta>(`/ventas/${id}/cancelar`)
        return data
    },
}
