import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import {
    TrendingUp,
    ShoppingCart,
    Ticket,
    Beer,
    RefreshCw,
    AlertTriangle,
    Trophy,
    Activity,
    ChevronRight,
} from "lucide-react"
import { eventosApi } from "@/api/eventos"
import { ventasApi, Venta } from "@/api/ventas"
import { productosApi } from "@/api/productos"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// ─── Helpers ────────────────────────────────────────────────────────────────

const CLP = (v: number) =>
    new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
    }).format(v)

/** Given all ventas, compute KPIs and chart data in one pass */
function computeMetrics(ventas: Venta[]) {
    const activas = ventas.filter((v) => v.estado !== "cancelado")

    const ingresosTotales = activas.reduce((s, v) => s + Number(v.total), 0)
    const totalVentas = activas.length

    const entradasVendidas = activas
        .filter((v) => v.tipo_venta === "ENTRADA")
        .flatMap((v) => v.detalles)
        .reduce((s, d) => s + d.cantidad, 0)

    const bebidasVendidas = activas
        .filter((v) => v.tipo_venta === "BEBIDA")
        .flatMap((v) => v.detalles)
        .reduce((s, d) => s + d.cantidad, 0)

    // Sales by hour
    const horasMap = new Map<number, { cantidad: number; ingresos: number }>()
    for (const v of activas) {
        const hora = new Date(v.fecha).getHours()
        const prev = horasMap.get(hora) ?? { cantidad: 0, ingresos: 0 }
        horasMap.set(hora, {
            cantidad: prev.cantidad + 1,
            ingresos: prev.ingresos + Number(v.total),
        })
    }
    const ventasPorHora = Array.from(horasMap.entries())
        .map(([hora, data]) => ({ hora, ...data }))
        .sort((a, b) => a.hora - b.hora)

    // Estado counts
    const estados: Record<string, number> = {
        pendiente: 0,
        preparando: 0,
        listo: 0,
        entregado: 0,
        pagado: 0,
    }
    for (const v of ventas) {
        if (v.estado in estados) estados[v.estado]++
    }
    const ventasPorEstado = Object.entries(estados).map(([estado, cantidad]) => ({
        estado,
        cantidad,
    }))

    // Top productos
    const prodMap = new Map<number, { nombre: string; cantidad: number; ingresos: number }>()
    for (const v of activas) {
        for (const d of v.detalles) {
            if (!d.producto_id) continue
            const prev = prodMap.get(d.producto_id) ?? {
                nombre: d.nombre_snapshot,
                cantidad: 0,
                ingresos: 0,
            }
            prodMap.set(d.producto_id, {
                nombre: prev.nombre,
                cantidad: prev.cantidad + d.cantidad,
                ingresos: prev.ingresos + Number(d.subtotal),
            })
        }
    }
    const topProductos = Array.from(prodMap.values())
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10)

    return {
        ingresosTotales,
        totalVentas,
        entradasVendidas,
        bebidasVendidas,
        ventasPorHora,
        ventasPorEstado,
        topProductos,
    }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
    title: string
    value: string
    subtitle?: string
    icon: React.ReactNode
    gradient: string
    glowColor: string
}

function KpiCard({ title, value, subtitle, icon, gradient, glowColor }: KpiCardProps) {
    return (
        <div
            className={`relative overflow-hidden rounded-2xl p-6 ${gradient} border border-white/10`}
            style={{ boxShadow: `0 0 30px ${glowColor}` }}
        >
            {/* Background glow blob */}
            <div
                className="absolute -top-4 -right-4 h-24 w-24 rounded-full opacity-30 blur-2xl"
                style={{ background: glowColor }}
            />
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-white/70">{title}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-white/50">{subtitle}</p>
                    )}
                </div>
                <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                    {icon}
                </div>
            </div>
        </div>
    )
}

const ESTADO_COLORS: Record<string, string> = {
    pendiente: "#f59e0b",
    preparando: "#3b82f6",
    listo: "#22c55e",
    entregado: "#a855f7",
    pagado: "#ec4899",
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function HoraTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/95 p-3 shadow-xl backdrop-blur">
            <p className="mb-2 text-xs font-semibold text-gray-400">{label}:00 hrs</p>
            <p className="text-sm text-violet-300">
                Ingresos: <span className="font-bold text-white">{CLP(payload[0]?.value ?? 0)}</span>
            </p>
            <p className="text-sm text-pink-300">
                Órdenes: <span className="font-bold text-white">{payload[1]?.value ?? 0}</span>
            </p>
        </div>
    )
}

function EstadoTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null
    const { estado, cantidad } = payload[0].payload
    return (
        <div className="rounded-xl border border-white/10 bg-gray-900/95 p-3 shadow-xl backdrop-blur">
            <p className="text-sm capitalize text-gray-300">
                {estado}: <span className="font-bold text-white">{cantidad}</span>
            </p>
        </div>
    )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-white/5 ${className}`}
        />
    )
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export function DashboardPage() {
    const [selectedEvento, setSelectedEvento] = useState<string>("global")

    // Fetch events for selector
    const { data: eventos = [] } = useQuery({
        queryKey: ["eventos"],
        queryFn: eventosApi.list,
    })

    // Fetch all ventas (for global mode or per-event computation)
    const {
        data: ventas = [],
        isLoading: isLoadingVentas,
        refetch: refetchVentas,
        isFetching,
    } = useQuery({
        queryKey: ["ventas-dashboard", selectedEvento],
        queryFn: () =>
            selectedEvento === "global"
                ? ventasApi.list()
                : ventasApi.list({ eventoId: Number(selectedEvento) }),
    })

    // Fetch all productos for low stock alert
    const { data: productos = [] } = useQuery({
        queryKey: ["productos-dashboard"],
        queryFn: () => productosApi.list(),
    })

    // Compute all metrics client-side
    const metrics = useMemo(() => computeMetrics(ventas), [ventas])

    // Low stock products (< 10 units)
    const bajoStock = useMemo(
        () =>
            productos
                .filter((p) => p.disponible && p.stock < 10)
                .sort((a, b) => a.stock - b.stock),
        [productos],
    )

    const maxProd = metrics.topProductos[0]?.cantidad ?? 1

    const eventoActual = eventos.find((e) => String(e.id) === selectedEvento)

    return (
        <div className="space-y-8">
            {/* ── Header ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        {selectedEvento === "global"
                            ? "Vista consolidada de todos los eventos"
                            : `Evento: ${eventoActual?.nombre ?? "…"}`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        id="evento-selector"
                        value={selectedEvento}
                        onChange={(e) => setSelectedEvento(e.target.value)}
                        className="w-60"
                    >
                        <option value="global">🌐 Todos los eventos</option>
                        {eventos.map((ev) => (
                            <option key={ev.id} value={String(ev.id)}>
                                {ev.nombre}
                            </option>
                        ))}
                    </Select>
                    <Button
                        id="dashboard-refresh-btn"
                        variant="outline"
                        size="sm"
                        onClick={() => refetchVentas()}
                        disabled={isFetching}
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                        />
                    </Button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            {isLoadingVentas ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-36" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="Ingresos Totales"
                        value={CLP(metrics.ingresosTotales)}
                        subtitle="Excluyendo cancelaciones"
                        icon={<TrendingUp className="h-5 w-5 text-white" />}
                        gradient="bg-gradient-to-br from-violet-700 to-purple-900"
                        glowColor="rgba(139, 92, 246, 0.4)"
                    />
                    <KpiCard
                        title="Ventas Totales"
                        value={String(metrics.totalVentas)}
                        subtitle="Órdenes procesadas"
                        icon={<ShoppingCart className="h-5 w-5 text-white" />}
                        gradient="bg-gradient-to-br from-fuchsia-600 to-pink-900"
                        glowColor="rgba(217, 70, 239, 0.4)"
                    />
                    <KpiCard
                        title="Entradas Vendidas"
                        value={String(metrics.entradasVendidas)}
                        subtitle="Tickets de acceso"
                        icon={<Ticket className="h-5 w-5 text-white" />}
                        gradient="bg-gradient-to-br from-blue-600 to-indigo-900"
                        glowColor="rgba(59, 130, 246, 0.4)"
                    />
                    <KpiCard
                        title="Bebidas Vendidas"
                        value={String(metrics.bebidasVendidas)}
                        subtitle="Unidades servidas"
                        icon={<Beer className="h-5 w-5 text-white" />}
                        gradient="bg-gradient-to-br from-emerald-600 to-teal-900"
                        glowColor="rgba(16, 185, 129, 0.4)"
                    />
                </div>
            )}

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                {/* Area Chart - Ingresos por Hora */}
                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-4 w-4 text-violet-400" />
                            Ingresos por Hora
                        </CardTitle>
                        <CardDescription>
                            Volumen de transacciones a lo largo de la noche
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingVentas ? (
                            <Skeleton className="h-64" />
                        ) : metrics.ventasPorHora.length === 0 ? (
                            <div className="flex h-64 items-center justify-center text-muted-foreground">
                                Sin datos para mostrar
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={metrics.ventasPorHora}>
                                    <defs>
                                        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradOrdenes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="hora"
                                        tickFormatter={(h) => `${h}h`}
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        yAxisId="ingresos"
                                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={55}
                                    />
                                    <YAxis
                                        yAxisId="cantidad"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={35}
                                    />
                                    <Tooltip content={<HoraTooltip />} />
                                    <Area
                                        yAxisId="ingresos"
                                        type="monotone"
                                        dataKey="ingresos"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        fill="url(#gradIngresos)"
                                        name="Ingresos"
                                    />
                                    <Area
                                        yAxisId="cantidad"
                                        type="monotone"
                                        dataKey="cantidad"
                                        stroke="#ec4899"
                                        strokeWidth={2}
                                        fill="url(#gradOrdenes)"
                                        name="Órdenes"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Bar Chart - Estado de Ventas */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShoppingCart className="h-4 w-4 text-pink-400" />
                            Estado de Ventas
                        </CardTitle>
                        <CardDescription>Distribución por estado actual</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingVentas ? (
                            <Skeleton className="h-64" />
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={metrics.ventasPorEstado} layout="vertical" barSize={16}>
                                    <CartesianGrid
                                        horizontal={false}
                                        strokeDasharray="3 3"
                                        stroke="rgba(255,255,255,0.05)"
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="estado"
                                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={70}
                                    />
                                    <Tooltip content={<EstadoTooltip />} />
                                    <Bar
                                        dataKey="cantidad"
                                        radius={[0, 6, 6, 0]}
                                        fill="#8b5cf6"
                                    >
                                        {metrics.ventasPorEstado.map((entry) => (
                                            <rect
                                                key={entry.estado}
                                                fill={ESTADO_COLORS[entry.estado] ?? "#8b5cf6"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Bottom Row: Top Products + Low Stock ── */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Top Products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Trophy className="h-4 w-4 text-amber-400" />
                            Top 10 Productos Más Vendidos
                        </CardTitle>
                        <CardDescription>Bebidas con mayor rotación</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoadingVentas ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-9" />
                                ))}
                            </div>
                        ) : metrics.topProductos.length === 0 ? (
                            <div className="flex h-48 items-center justify-center text-muted-foreground text-sm">
                                No hay datos de bebidas en este período
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {metrics.topProductos.map((prod, idx) => {
                                    const pct = Math.round((prod.cantidad / maxProd) * 100)
                                    return (
                                        <div key={idx} className="group">
                                            <div className="mb-1 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                                            idx === 0
                                                                ? "bg-amber-500 text-amber-950"
                                                                : idx === 1
                                                                ? "bg-gray-400 text-gray-900"
                                                                : idx === 2
                                                                ? "bg-orange-700 text-orange-100"
                                                                : "bg-white/10 text-muted-foreground"
                                                        }`}
                                                    >
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-sm font-medium truncate max-w-[160px]">
                                                        {prod.nombre}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-right">
                                                    <span className="text-xs text-muted-foreground">
                                                        {prod.cantidad} uds
                                                    </span>
                                                    <span className="text-xs font-semibold text-violet-400">
                                                        {CLP(prod.ingresos)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all duration-700 ease-out"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Low Stock Alert */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-rose-400" />
                            Inventario Crítico
                            {bajoStock.length > 0 && (
                                <Badge className="ml-1 bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs">
                                    {bajoStock.length} productos
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription>Productos con menos de 10 unidades disponibles</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {bajoStock.length === 0 ? (
                            <div className="flex h-48 flex-col items-center justify-center gap-3 text-center">
                                <div className="rounded-full bg-emerald-500/10 p-4">
                                    <Activity className="h-8 w-8 text-emerald-400" />
                                </div>
                                <p className="text-sm font-medium text-emerald-400">
                                    ¡Stock en buen estado!
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Todos los productos tienen suficiente inventario.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {bajoStock.map((prod) => (
                                    <div
                                        key={prod.id}
                                        className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 transition-colors hover:bg-rose-500/10"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`h-2 w-2 rounded-full ${
                                                    prod.stock === 0
                                                        ? "bg-red-500"
                                                        : prod.stock <= 3
                                                        ? "animate-pulse bg-orange-500"
                                                        : "bg-yellow-500"
                                                }`}
                                            />
                                            <span className="text-sm font-medium">{prod.nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`text-xs ${
                                                    prod.stock === 0
                                                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                                                        : prod.stock <= 3
                                                        ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                                }`}
                                            >
                                                {prod.stock === 0
                                                    ? "Sin stock"
                                                    : `${prod.stock} uds`}
                                            </Badge>
                                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}