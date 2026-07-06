import { apiClient } from "./client"

export interface Producto {
    id: number
    nombre: string
    descripcion: string | null
    precio: number
    stock: number
    disponible: boolean
    imagen_url: string | null
    fecha_creacion: string
}

export interface ProductoInput {
    nombre: string
    descripcion?: string
    precio: number
    stock?: number
    disponible?: boolean
}

/**
 * Construye un FormData ignorando valores vacíos/NaN/undefined.
 * Permite enviar imágenes opcionalmente al backend.
 */
function buildFormData(input: Record<string, any>, imagen?: File): FormData {
    const form = new FormData()
    Object.entries(input).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        if (typeof v === "string" && v.trim() === "") return
        if (typeof v === "number" && Number.isNaN(v)) return
        form.append(k, String(v))
    })
    if (imagen) form.append("imagen", imagen)
    return form
}

export const productosApi = {
    list: async (disponiblesOnly?: boolean): Promise<Producto[]> => {
        const url = disponiblesOnly ? "/productos?disponibles=true" : "/productos"
        const { data } = await apiClient.get<Producto[]>(url)
        return data
    },

    get: async (id: number): Promise<Producto> => {
        const { data } = await apiClient.get<Producto>(`/productos/${id}`)
        return data
    },

    create: async (input: ProductoInput, imagen?: File): Promise<Producto> => {
        const form = buildFormData(input, imagen)
        const { data } = await apiClient.post<Producto>("/productos", form)
        return data
    },

    update: async (
        id: number,
        input: Partial<ProductoInput>,
        imagen?: File,
    ): Promise<Producto> => {
        const form = buildFormData(input, imagen)
        const { data } = await apiClient.patch<Producto>(`/productos/${id}`, form)
        return data
    },

    delete: async (id: number): Promise<void> => {
        await apiClient.delete(`/productos/${id}`)
    },

    toggleDisponibilidad: async (id: number): Promise<Producto> => {
        const { data } = await apiClient.patch<Producto>(`/productos/${id}/toggle-disponibilidad`)
        return data
    },

    ajustarStock: async (id: number, cantidad: number): Promise<Producto> => {
        const { data } = await apiClient.patch<Producto>(`/productos/${id}/stock`, { cantidad })
        return data
    },
}
