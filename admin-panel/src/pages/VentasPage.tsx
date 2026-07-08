import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import {
    Search,
    Eye,
    XCircle,
    Ticket,
    Beer,
    CreditCard,
    QrCode,
    Clock,
    User,
    Phone,
    FileText,
    Calendar,
    ChevronRight,
    RefreshCw
} from "lucide-react"

import { ventasApi, Venta } from "@/api/ventas"
import { eventosApi } from "@/api/eventos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

const ESTADOS = [
    { value: "Todos", label: "Todos los estados" },
    { value: "pendiente", label: "Pendiente" },
    { value: "pagado", label: "Pagado" },
    { value: "preparando", label: "Preparando" },
    { value: "listo", label: "Listo" },
    { value: "entregado", label: "Entregado" },
    { value: "cancelado", label: "Cancelado" },
]

const TIPOS = [
    { value: "Todos", label: "Todos los tipos" },
    { value: "ENTRADA", label: "Entrada" },
    { value: "BEBIDA", label: "Bebida / Bar" },
]

function getEstadoBadge(estado: Venta["estado"]) {
    switch (estado) {
        case "pendiente":
            return <Badge variant="warning">Pendiente</Badge>
        case "pagado":
            return <Badge variant="secondary" className="bg-sky-500/10 text-sky-500 border-sky-500/20">Pagado</Badge>
        case "preparando":
            return <Badge variant="default" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Preparando</Badge>
        case "listo":
            return <Badge variant="default" className="bg-pink-500/10 text-pink-500 border-pink-500/20">Listo</Badge>
        case "entregado":
            return <Badge variant="success">Entregado</Badge>
        case "cancelado":
            return <Badge variant="destructive">Cancelado</Badge>
        default:
            return <Badge>{estado}</Badge>
    }
}

export function VentasPage() {
    const queryClient = useQueryClient()

    // Filters and search state
    const [busqueda, setBusqueda] = useState("")
    const [eventoFiltro, setEventoFiltro] = useState("Todos")
    const [estadoFiltro, setEstadoFiltro] = useState("Todos")
    const [tipoFiltro, setTipoFiltro] = useState("Todos")

    // Active dialog states
    const [detalleId, setDetalleId] = useState<number | null>(null)
    const [cancelarId, setCancelarId] = useState<number | null>(null)

    // Fetch Events for filters dropdown
    const { data: eventos = [] } = useQuery({
        queryKey: ["eventos"],
        queryFn: eventosApi.list,
    })

    // Fetch Sales based on filters
    const { data: ventas = [], isLoading, isRefetching } = useQuery({
        queryKey: ["ventas-historial", eventoFiltro, estadoFiltro, tipoFiltro],
        queryFn: () =>
            ventasApi.list({
                eventoId: eventoFiltro === "Todos" ? undefined : Number(eventoFiltro),
                estado: estadoFiltro,
                tipo: tipoFiltro,
            }),
    })

    // Fetch single sale details
    const { data: ventaDetalle, isLoading: isLoadingDetalle } = useQuery({
        queryKey: ["venta-detalle", detalleId],
        queryFn: () => ventasApi.get(Number(detalleId)),
        enabled: !!detalleId,
    })

    // Mutation: Update status
    const updateEstadoMutation = useMutation({
        mutationFn: ({ id, estado }: { id: number; estado: string }) =>
            ventasApi.updateEstado(id, estado),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["ventas-historial"] })
            queryClient.invalidateQueries({ queryKey: ["venta-detalle", detalleId] })
            // Al cancelar una venta se restaura stock de bebidas
            if (variables.estado === 'cancelado') {
                queryClient.invalidateQueries({ queryKey: ["productos"] })
            }
            toast.success("Estado de venta actualizado")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al actualizar estado")
        },
    })

    // Mutation: Cancel sale
    const cancelarMutation = useMutation({
        mutationFn: (id: number) => ventasApi.cancelar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ventas-historial"] })
            queryClient.invalidateQueries({ queryKey: ["venta-detalle", detalleId] })
            // Restaurar stock al cancelar
            queryClient.invalidateQueries({ queryKey: ["productos"] })
            toast.success("Venta cancelada exitosamente")
            setCancelarId(null)
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al cancelar venta")
        },
    })

    // Client-side text search filter
    const ventasFiltradas = ventas.filter((v) => {
        const matchesText =
            String(v.id).includes(busqueda) ||
            v.usuario.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            v.usuario.telefono.includes(busqueda) ||
            (v.notas && v.notas.toLowerCase().includes(busqueda.toLowerCase()))
        return matchesText
    })

    const handleUpdateEstado = (id: number, estado: string) => {
        updateEstadoMutation.mutate({ id, estado })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Historial de Ventas
                        {isRefetching && (
                            <RefreshCw className="w-4 h-4 text-muted-foreground animate-spin" />
                        )}
                    </h1>
                    <p className="text-muted-foreground">Consulta transacciones, despachos y tickets emitidos</p>
                </div>
            </div>

            {/* Filter controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar ID, cliente o teléfono..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Event Filter */}
                <Select
                    value={eventoFiltro}
                    onChange={(e) => setEventoFiltro(e.target.value)}
                >
                    <option value="Todos">Todos los eventos</option>
                    {eventos.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                            {ev.nombre}
                        </option>
                    ))}
                </Select>

                {/* Type Filter */}
                <Select
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                >
                    {TIPOS.map((t) => (
                        <option key={t.value} value={t.value}>
                            {t.label}
                        </option>
                    ))}
                </Select>

                {/* Status Filter */}
                <Select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                >
                    {ESTADOS.map((est) => (
                        <option key={est.value} value={est.value}>
                            {est.label}
                        </option>
                    ))}
                </Select>
            </div>

            {/* Sales Table */}
            <div className="rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Cargando historial de ventas...
                                </TableCell>
                            </TableRow>
                        ) : ventasFiltradas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    No se encontraron transacciones
                                </TableCell>
                            </TableRow>
                        ) : (
                            ventasFiltradas.map((v) => (
                                <TableRow key={v.id} className="hover:bg-accent/40 transition-colors">
                                    <TableCell className="font-mono font-bold">#{v.id}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-foreground">{v.usuario.nombre}</div>
                                        <div className="text-xs text-muted-foreground">{v.usuario.telefono}</div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(v.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm font-medium">
                                            {v.tipo_venta === "ENTRADA" ? (
                                                <>
                                                    <Ticket className="w-4 h-4 text-primary" />
                                                    Entrada
                                                </>
                                            ) : (
                                                <>
                                                    <Beer className="w-4 h-4 text-sky-500" />
                                                    Bebida / Bar
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        ${Number(v.total).toLocaleString("es-CL")}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getEstadoBadge(v.estado)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setDetalleId(v.id)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {v.estado !== "cancelado" && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setCancelarId(v.id)}
                                                >
                                                    <XCircle className="w-4 h-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal: Detalle de Venta */}
            <Dialog open={!!detalleId} onOpenChange={(o) => !o && setDetalleId(null)}>
                <DialogContent className="max-w-2xl" onClose={() => setDetalleId(null)}>
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2 font-bold">
                            Detalle de Venta #{detalleId}
                            {ventaDetalle && getEstadoBadge(ventaDetalle.estado)}
                        </DialogTitle>
                        <DialogDescription>
                            {ventaDetalle && (
                                <span className="flex items-center gap-1 text-xs">
                                    <Clock className="w-3.5 h-3.5" />
                                    Realizado el {format(new Date(ventaDetalle.fecha), "dd 'de' MMMM 'yyyy' a las' HH:mm", { locale: es })}
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {isLoadingDetalle || !ventaDetalle ? (
                        <div className="py-12 text-center text-muted-foreground">
                            Cargando detalles de la venta...
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Grid info comprador/transaccion */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Datos Comprador */}
                                <div className="border rounded-xl p-4 bg-muted/30 space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" /> Comprador
                                    </h3>
                                    <div className="text-sm font-semibold">{ventaDetalle.usuario.nombre}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {ventaDetalle.usuario.telefono}
                                    </div>
                                    <div className="text-xs text-muted-foreground">ID Usuario: {ventaDetalle.usuario_id}</div>
                                </div>

                                {/* Datos Transacción */}
                                <div className="border rounded-xl p-4 bg-muted/30 space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <CreditCard className="w-3.5 h-3.5" /> Transacción
                                    </h3>
                                    <div className="text-sm font-semibold flex items-center gap-1.5">
                                        Pago: <span className="capitalize">{ventaDetalle.metodo_pago || "—"}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Tipo: {ventaDetalle.tipo_venta === "ENTRADA" ? "Entrada al Club" : "Consumibles / Bar"}
                                    </div>
                                    {ventaDetalle.admin_id && (
                                        <div className="text-xs text-muted-foreground">Atendido por Admin ID: {ventaDetalle.admin_id}</div>
                                    )}
                                </div>
                            </div>

                            {/* QR Section if Entrada */}
                            {ventaDetalle.tipo_venta === "ENTRADA" && (
                                <div className="border rounded-xl p-4 flex flex-col md:flex-row items-center gap-4 bg-primary/5 border-primary/10">
                                    <div className="bg-card p-3 rounded-lg border flex items-center justify-center">
                                        <QrCode className="w-20 h-20 text-primary" />
                                    </div>
                                    <div className="space-y-1 text-center md:text-left">
                                        <div className="text-sm font-bold flex items-center justify-center md:justify-start gap-1 text-foreground">
                                            Código QR de Entrada
                                        </div>
                                        <p className="text-xs text-muted-foreground max-w-sm">
                                            Este código QR es único y valida el acceso al club.
                                        </p>
                                        <div className="pt-1.5 flex flex-wrap gap-2 justify-center md:justify-start">
                                            <Badge variant={ventaDetalle.qr_escaneado ? "success" : "secondary"}>
                                                {ventaDetalle.qr_escaneado ? "Código Escaneado / Usado" : "Pendiente de Escaneo"}
                                            </Badge>
                                            <div className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {ventaDetalle.qr_code?.substring(0, 18)}...
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Line items details table */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5" /> Detalle de productos
                                </h3>
                                <div className="border rounded-xl overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-center w-20">Cant</TableHead>
                                                <TableHead className="text-right">Unitario</TableHead>
                                                <TableHead className="text-right">Subtotal</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {ventaDetalle.detalles.map((det) => (
                                                <TableRow key={det.id}>
                                                    <TableCell className="font-medium">
                                                        {det.nombre_snapshot}
                                                        {det.notas && (
                                                            <div className="text-xs text-destructive font-medium mt-0.5">
                                                                Nota: {det.notas}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center font-mono font-semibold">{det.cantidad}</TableCell>
                                                    <TableCell className="text-right">${Number(det.precio_unitario).toLocaleString("es-CL")}</TableCell>
                                                    <TableCell className="text-right font-semibold">${Number(det.subtotal).toLocaleString("es-CL")}</TableCell>
                                                </TableRow>
                                            ))}
                                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-t-2">
                                                <TableCell colSpan={3} className="font-bold text-right text-foreground">Total:</TableCell>
                                                <TableCell className="font-bold text-right text-lg text-primary">
                                                    ${Number(ventaDetalle.total).toLocaleString("es-CL")}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Acciones de administración */}
                            {ventaDetalle.estado !== "cancelado" && (
                                <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Panel de Acciones
                                    </h3>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="actualizarEstado" className="text-xs">Modificar estado de preparación / entrega</Label>
                                            <Select
                                                id="actualizarEstado"
                                                value={ventaDetalle.estado}
                                                onChange={(e) => handleUpdateEstado(ventaDetalle.id, e.target.value)}
                                                className="w-full sm:w-48"
                                                disabled={updateEstadoMutation.isPending}
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="pagado">Pagado</option>
                                                <option value="preparando">Preparando</option>
                                                <option value="listo">Listo</option>
                                                <option value="entregado">Entregado</option>
                                            </Select>
                                        </div>

                                        <Button
                                            variant="destructive"
                                            onClick={() => setCancelarId(ventaDetalle.id)}
                                            className="w-full sm:w-auto mt-2 sm:mt-0"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Cancelar Transacción
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setDetalleId(null)}>Cerrar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Confirmación Cancelación */}
            <Dialog open={!!cancelarId} onOpenChange={(o) => !o && setCancelarId(null)}>
                <DialogContent onClose={() => setCancelarId(null)}>
                    <DialogHeader>
                        <DialogTitle>¿Cancelar venta y transacción?</DialogTitle>
                        <DialogDescription>
                            Esta acción cancelará la orden #{cancelarId}. Si se trata de un consumible/bebida, se devolverán los productos al stock del inventario automáticamente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelarId(null)}>
                            Volver
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => cancelarId && cancelarMutation.mutate(cancelarId)}
                            disabled={cancelarMutation.isPending}
                        >
                            {cancelarMutation.isPending ? "Cancelando..." : "Confirmar Cancelación"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}