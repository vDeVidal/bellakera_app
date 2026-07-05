import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Calendar,
    DollarSign,
    Users,
    Ticket,
    Wine,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts"

import { eventosApi } from "@/api/eventos"
import { buildImageUrl } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

const COLORS = ["#8b5cf6", "#ec4899", "#f97316", "#10b981", "#3b82f6"]

function estadoBadge(estado: string) {
    switch (estado) {
        case "ACTIVO":
            return <Badge variant="success">Activo</Badge>
        case "CERRADO":
            return <Badge variant="secondary">Cerrado</Badge>
        case "CANCELADO":
            return <Badge variant="destructive">Cancelado</Badge>
        default:
            return <Badge>{estado}</Badge>
    }
}

export function EventoDetallePage() {
    const { id } = useParams()
    const eventoId = Number(id)
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [confirmarEliminar, setConfirmarEliminar] = useState(false)

    const { data: evento, isLoading } = useQuery({
        queryKey: ["evento", id],
        queryFn: () => eventosApi.get(eventoId),
    })

    const { data: reporte } = useQuery({
        queryKey: ["evento-reporte", id],
        queryFn: () => eventosApi.reporte(eventoId),
        enabled: !!evento,
        retry: false, // no fallar si no hay ventas aún
    })

    const eliminarMutation = useMutation({
        mutationFn: () => eventosApi.delete(eventoId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["eventos"] })
            toast.success("Evento eliminado")
            navigate("/eventos")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al eliminar")
        },
    })

    if (isLoading || !evento) {
        return <div className="text-muted-foreground">Cargando...</div>
    }

    const topProductosData =
        reporte?.topProductos.map((p) => ({
            name: p.nombre,
            cantidad: p.cantidad,
        })) ?? []

    const estadoVentasData = reporte
        ? [
              { name: "Pendiente", value: reporte.ventasPorEstado.pendiente },
              { name: "Preparando", value: reporte.ventasPorEstado.preparando },
              { name: "Listo", value: reporte.ventasPorEstado.listo },
              { name: "Entregado", value: reporte.ventasPorEstado.entregado },
          ].filter((d) => d.value > 0)
        : []

    const ingresosTotales = reporte?.resumen.ingresosTotales ?? 0
    const entradasVendidas = reporte?.resumen.entradasVendidas ?? 0
    const bebidasVendidas = reporte?.resumen.bebidasVendidas ?? 0
    const aforo = evento.aforo_maximo ?? 0

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate("/eventos")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Volver
                    </Button>
                    <h1 className="text-2xl font-bold">{evento.nombre}</h1>
                    {estadoBadge(evento.estado)}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/eventos/${eventoId}/editar`)}
                    >
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar
                    </Button>
                    <Button variant="destructive" onClick={() => setConfirmarEliminar(true)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    {evento.imagen_url ? (
                        <img
                            src={buildImageUrl(evento.imagen_url)}
                            alt={evento.nombre}
                            className="w-full aspect-square object-cover rounded-lg border border-border"
                        />
                    ) : (
                        <div className="w-full aspect-square rounded-lg border border-border bg-muted flex items-center justify-center">
                            <Calendar className="w-16 h-16 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Descripción</p>
                            <p className="mt-1">{evento.descripcion || "Sin descripción"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Fecha</p>
                                <p className="font-medium mt-1">
                                    {format(new Date(evento.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Precio</p>
                                <p className="font-medium mt-1">
                                    ${evento.precio.toLocaleString("es-CL")}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Aforo máximo</p>
                                <p className="font-medium mt-1">{aforo || "Sin límite"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Creado</p>
                                <p className="font-medium mt-1">
                                    {format(new Date(evento.fecha_creacion), "dd MMM yyyy", { locale: es })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div>
                <h2 className="text-xl font-semibold mb-4">Estadísticas del evento</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Ingresos totales</p>
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold mt-2">
                            ${ingresosTotales.toLocaleString("es-CL")}
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Entradas vendidas</p>
                            <Ticket className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold mt-2">{entradasVendidas}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            ${(reporte?.resumen.ingresosEntradas ?? 0).toLocaleString("es-CL")}
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Bebidas vendidas</p>
                            <Wine className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold mt-2">{bebidasVendidas}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            ${(reporte?.resumen.ingresosBebidas ?? 0).toLocaleString("es-CL")}
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">Ocupación</p>
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold mt-2">
                            {entradasVendidas}/{aforo || "∞"}
                        </p>
                        {aforo > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {((entradasVendidas / aforo) * 100).toFixed(1)}%
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-lg border border-border bg-card p-6">
                        <h3 className="font-semibold mb-4">Top productos vendidos</h3>
                        {topProductosData.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                Sin ventas de bebidas aún
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={topProductosData}>
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 12 }}
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="cantidad" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="rounded-lg border border-border bg-card p-6">
                        <h3 className="font-semibold mb-4">Estado de ventas</h3>
                        {estadoVentasData.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">
                                Sin ventas aún
                            </p>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={estadoVentasData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                    >
                                        {estadoVentasData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={confirmarEliminar} onOpenChange={setConfirmarEliminar}>
                <DialogContent onClose={() => setConfirmarEliminar(false)}>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar evento?</DialogTitle>
                        <DialogDescription>
                            Se eliminará permanentemente el evento <strong>{evento.nombre}</strong>{" "}
                            junto con su imagen. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmarEliminar(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => eliminarMutation.mutate()}
                            disabled={eliminarMutation.isPending}
                        >
                            {eliminarMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}