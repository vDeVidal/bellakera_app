import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { ClipboardList, Play, Check, XCircle, Clock, RefreshCw, User, Phone, Beer, ChevronRight } from "lucide-react"

import { ventasApi, Venta } from "@/api/ventas"
import { eventosApi } from "@/api/eventos"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function ColaPage() {
    const queryClient = useQueryClient()
    const [eventoFiltro, setEventoFiltro] = useState<string>("TODOS")

    // Fetch events for filter dropdown
    const { data: eventos = [] } = useQuery({
        queryKey: ["eventos"],
        queryFn: eventosApi.list,
    })

    // Fetch active order queue (polls every 5 seconds)
    const { data: cola = [], isLoading, isRefetching } = useQuery({
        queryKey: ["cola-pedidos", eventoFiltro],
        queryFn: () => ventasApi.getCola(eventoFiltro === "TODOS" ? undefined : Number(eventoFiltro)),
        refetchInterval: 5000,
    })

    // Mutation: Update status
    const updateEstadoMutation = useMutation({
        mutationFn: ({ id, estado }: { id: number; estado: string }) =>
            ventasApi.updateEstado(id, estado),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["cola-pedidos"] })
            queryClient.invalidateQueries({ queryKey: ["ventas"] })
            // Al cancelar desde cola también se restaura stock
            if (variables.estado === 'cancelado' || variables.estado === 'entregado') {
                queryClient.invalidateQueries({ queryKey: ["productos"] })
            }
            toast.success(`Pedido marcado como: ${variables.estado.toUpperCase()}`)
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al actualizar estado")
        },
    })

    // Mutation: Cancel order
    const cancelarMutation = useMutation({
        mutationFn: (id: number) => ventasApi.cancelar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cola-pedidos"] })
            queryClient.invalidateQueries({ queryKey: ["ventas"] })
            // Cancelar devuelve el stock de bebidas
            queryClient.invalidateQueries({ queryKey: ["productos"] })
            toast.success("Pedido cancelado")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al cancelar pedido")
        },
    })

    const handleUpdateEstado = (id: number, nuevoEstado: string) => {
        updateEstadoMutation.mutate({ id, estado: nuevoEstado })
    }

    const handleCancelar = (id: number) => {
        if (window.confirm("¿Seguro que deseas cancelar este pedido? Se devolverá el stock.")) {
            cancelarMutation.mutate(id)
        }
    }

    const formatTiempo = (fechaStr: string) => {
        try {
            return formatDistanceToNow(new Date(fechaStr), { addSuffix: true, locale: es })
        } catch {
            return "Hace un momento"
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Cola de pedidos
                        {isRefetching && (
                            <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                        )}
                    </h1>
                    <p className="text-muted-foreground">Monitorea y despacha las bebidas en tiempo real (Autorefresco 5s)</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-sm text-muted-foreground hidden md:inline">Filtrar Evento:</span>
                    <Select
                        value={eventoFiltro}
                        onChange={(e) => setEventoFiltro(e.target.value)}
                        className="w-full sm:w-64"
                    >
                        <option value="TODOS">Todos los eventos activos</option>
                        {eventos
                            .filter((ev) => ev.estado === "ACTIVO")
                            .map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                    {ev.nombre}
                                </option>
                            ))}
                    </Select>
                </div>
            </div>

            {/* Loading / Empty / Content states */}
            {isLoading ? (
                <div className="rounded-xl border p-16 text-center text-muted-foreground">
                    <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                    Cargando la cola de preparación...
                </div>
            ) : cola.length === 0 ? (
                <div className="rounded-xl border border-border bg-card/40 p-16 text-center text-muted-foreground relative overflow-hidden flex flex-col items-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />
                    <div className="relative mb-4">
                        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                        <ClipboardList className="w-12 h-12 text-muted-foreground relative z-10" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-1">¡Todo al día!</h3>
                    <p className="max-w-md text-sm mb-4">No hay pedidos pendientes ni en preparación en este momento.</p>
                    <div className="flex items-center gap-2 text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                        Escuchando nuevos pedidos...
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cola.map((pedido) => {
                        const isPrep = pedido.estado === "preparando"

                        return (
                            <div
                                key={pedido.id}
                                className={`rounded-xl border transition-all duration-300 relative overflow-hidden bg-card ${
                                    isPrep
                                        ? "border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                        : "border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]"
                                }`}
                            >
                                {/* Top Banner indicator */}
                                <div
                                    className={`h-1.5 w-full ${
                                        isPrep ? "bg-blue-500" : "bg-yellow-500"
                                    }`}
                                />

                                <div className="p-5 space-y-4">
                                    {/* Order header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-xs font-mono font-bold text-muted-foreground">
                                                ID: #{pedido.id}
                                            </span>
                                            <h3 className="font-bold text-base mt-0.5 flex items-center gap-1.5 text-foreground">
                                                {pedido.usuario.nombre}
                                            </h3>
                                        </div>
                                        <Badge
                                            variant={isPrep ? "default" : "warning"}
                                            className="text-xs uppercase"
                                        >
                                            {pedido.estado}
                                        </Badge>
                                    </div>

                                    {/* Client info & time elapsed */}
                                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2.5 rounded-lg border border-border/40">
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5" />
                                            {pedido.usuario.telefono}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-primary/70" />
                                            Comprado {formatTiempo(pedido.fecha)}
                                        </div>
                                    </div>

                                    {/* Order items */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                            <Beer className="w-3.5 h-3.5" /> Items del Pedido
                                        </h4>
                                        <div className="divide-y divide-border/40">
                                            {pedido.detalles.map((item) => (
                                                <div key={item.id} className="py-2 first:pt-0 last:pb-0">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-foreground">
                                                            {item.nombre_snapshot}
                                                        </span>
                                                        <span className="font-mono font-bold text-primary">
                                                            x{item.cantidad}
                                                        </span>
                                                    </div>
                                                    {item.notas && (
                                                        <p className="text-xs text-destructive bg-destructive/5 border border-destructive/10 rounded px-1.5 py-0.5 mt-1 font-medium">
                                                            Nota: {item.notas}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Order footer notes / total */}
                                    {pedido.notas && (
                                        <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 text-xs text-foreground font-medium">
                                            Notas generales: {pedido.notas}
                                        </div>
                                    )}

                                    <div className="pt-2 border-t flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Total:</span>
                                        <span className="font-bold text-base text-foreground">
                                            ${pedido.total.toLocaleString("es-CL")}
                                        </span>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleCancelar(pedido.id)}
                                            disabled={
                                                cancelarMutation.isPending ||
                                                updateEstadoMutation.isPending
                                            }
                                            className="h-9"
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" />
                                            Cancelar
                                        </Button>

                                        {isPrep ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateEstado(pedido.id, "listo")}
                                                disabled={
                                                    updateEstadoMutation.isPending ||
                                                    cancelarMutation.isPending
                                                }
                                                className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                                            >
                                                <Check className="w-4 h-4 mr-1.5" />
                                                Listo
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                onClick={() => handleUpdateEstado(pedido.id, "preparando")}
                                                disabled={
                                                    updateEstadoMutation.isPending ||
                                                    cancelarMutation.isPending
                                                }
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white h-9"
                                            >
                                                <Play className="w-4 h-4 mr-1.5" />
                                                Preparar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}