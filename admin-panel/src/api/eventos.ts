import { apiClient } from "./client"

export interface Evento {
    id: number
    nombre: string
    descripcion: string | null
    fecha: string
    precio: number
    aforo_maximo: number | null
    estado: "ACTIVO" | "CERRADO" | "CANCELADO"
    imagen_url: string | null
    fecha_cierre: string | null
    fecha_creacion: string
}

export interface EventoInput {
    nombre: string
    descripcion?: string
    fecha: string
    precio: number
    aforo_maximo?: number
    estado?: "ACTIVO" | "CERRADO" | "CANCELADO"
}

// (ReporteEvento se queda igual)
export interface ReporteEvento {
    evento: { id: number; titulo: string; fecha: string }
    resumen: {
        totalVentas: number
        ingresosTotales: number
        ingresosEntradas: number
        ingresosBebidas: number
        entradasVendidas: number
        bebidasVendidas: number
    }
    topProductos: Array<{ nombre: string; cantidad: number; ingresos: number }>
    ventasPorHora: Array<{ hora: number; cantidad: number; ingresos: number }>
    ventasPorEstado: {
        pendiente: number
        preparando: number
        listo: number
        entregado: number
    }
}

/**
 * Construye un FormData ignorando valores vacíos/NaN/undefined.
 * Evita mandar "precio: ''" que en backend se convierte en 0.
 */
function buildFormData(input: Record<string, any>, flyer?: File): FormData {
    const form = new FormData()
    Object.entries(input).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        if (typeof v === "string" && v.trim() === "") return
        if (typeof v === "number" && Number.isNaN(v)) return
        form.append(k, String(v))
    })
    if (flyer) form.append("flyer", flyer)
    return form
}

export const eventosApi = {
    list: async (): Promise<Evento[]> => {
        const { data } = await apiClient.get<Evento[]>("/eventos")
        return data
    },

    get: async (id: number): Promise<Evento> => {
        const { data } = await apiClient.get<Evento>(`/eventos/${id}`)
        return data
    },

    create: async (input: EventoInput, flyer?: File): Promise<Evento> => {
        const form = buildFormData(input, flyer)
        // ⚠️ NO seteamos Content-Type manualmente: axios lo hace con boundary
        const { data } = await apiClient.post<Evento>("/eventos", form)
        return data
    },

    update: async (
        id: number,
        input: Partial<EventoInput>,
        flyer?: File,
    ): Promise<Evento> => {
        const form = buildFormData(input, flyer)
        const { data } = await apiClient.patch<Evento>(`/eventos/${id}`, form)
        return data
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/eventos/${id}`)
    },

    reporte: async (id: number): Promise<ReporteEvento> => {
        const { data } = await apiClient.get<ReporteEvento>(`/ventas/reporte/${id}`)
        return data
    },
}