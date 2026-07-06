import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Pencil, Trash2, Beer, PlusCircle, MinusCircle, Package, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

import { productosApi, Producto } from "@/api/productos"
import { buildImageUrl } from "@/api/client"
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

const CATEGORIES = ["Todos", "Tragos", "Cervezas", "Sin Alcohol", "Comida", "Otros"]

// Helper functions for category parsing
function parseDescription(rawDesc: string | null) {
    if (!rawDesc) {
        return { categoria: "Otros", descripcionReal: "" }
    }
    const idx = rawDesc.indexOf(" | ")
    if (idx !== -1) {
        return {
            categoria: rawDesc.substring(0, idx).trim(),
            descripcionReal: rawDesc.substring(idx + 3).trim(),
        }
    }
    return { categoria: "Otros", descripcionReal: rawDesc }
}

export function ProductosPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // Filters and search state
    const [busqueda, setBusqueda] = useState("")
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todos")
    const [disponibilidadFiltro, setDisponibilidadFiltro] = useState("TODOS")

    // Modal/Dialog states
    const [eliminarId, setEliminarId] = useState<number | null>(null)
    const [stockAjusteId, setStockAjusteId] = useState<number | null>(null)
    const [cantidadAjuste, setCantidadAjuste] = useState("")

    // API query
    const { data: productos = [], isLoading } = useQuery({
        queryKey: ["productos"],
        queryFn: () => productosApi.list(),
    })

    // Mutations
    const eliminarMutation = useMutation({
        mutationFn: (id: number) => productosApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productos"] })
            toast.success("Producto eliminado")
            setEliminarId(null)
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al eliminar el producto")
        },
    })

    const toggleDisponibilidadMutation = useMutation({
        mutationFn: (id: number) => productosApi.toggleDisponibilidad(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productos"] })
            toast.success("Disponibilidad actualizada")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al cambiar disponibilidad")
        },
    })

    const ajustarStockMutation = useMutation({
        mutationFn: ({ id, cantidad }: { id: number; cantidad: number }) =>
            productosApi.ajustarStock(id, cantidad),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["productos"] })
            toast.success("Stock actualizado")
            setStockAjusteId(null)
            setCantidadAjuste("")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al ajustar el stock")
        },
    })

    // Filter logic
    const productosFiltrados = productos.filter((p) => {
        const { categoria, descripcionReal } = parseDescription(p.descripcion)

        const matchesBusqueda =
            p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            descripcionReal.toLowerCase().includes(busqueda.toLowerCase())

        const matchesCategoria =
            categoriaFiltro === "Todos" ||
            categoria === categoriaFiltro

        const matchesDisponibilidad =
            disponibilidadFiltro === "TODOS" ||
            (disponibilidadFiltro === "DISPONIBLE" && p.disponible) ||
            (disponibilidadFiltro === "NO_DISPONIBLE" && !p.disponible)

        return matchesBusqueda && matchesCategoria && matchesDisponibilidad
    })

    const productoAEliminar = productos.find((p) => p.id === eliminarId)
    const productoAjustarStock = productos.find((p) => p.id === stockAjusteId)

    const handleQuickStockAdjust = (id: number, cantidad: number) => {
        ajustarStockMutation.mutate({ id, cantidad })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
                    <p className="text-muted-foreground">Bebidas, tragos y artículos disponibles para venta</p>
                </div>
                <Button onClick={() => navigate("/productos/nuevo")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo producto
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o descripción..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {/* Category select */}
                <Select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="md:w-48"
                >
                    <option value="Todos">Todas las categorías</option>
                    {CATEGORIES.slice(1).map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </Select>

                {/* Availability select */}
                <Select
                    value={disponibilidadFiltro}
                    onChange={(e) => setDisponibilidadFiltro(e.target.value)}
                    className="md:w-48"
                >
                    <option value="TODOS">Todos los estados</option>
                    <option value="DISPONIBLE">Disponibles</option>
                    <option value="NO_DISPONIBLE">No disponibles</option>
                </Select>
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-20">Imagen</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="hidden md:table-cell">Descripción</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead className="w-40 text-center">Stock</TableHead>
                            <TableHead className="text-center">Disponibilidad</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    Cargando productos...
                                </TableCell>
                            </TableRow>
                        ) : productosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    No se encontraron productos
                                </TableCell>
                            </TableRow>
                        ) : (
                            productosFiltrados.map((producto) => {
                                const { categoria, descripcionReal } = parseDescription(producto.descripcion)
                                const isLowStock = producto.stock <= 10

                                return (
                                    <TableRow key={producto.id} className="hover:bg-accent/40 transition-colors">
                                        {/* Image */}
                                        <TableCell>
                                            {producto.imagen_url ? (
                                                <img
                                                    src={buildImageUrl(producto.imagen_url)}
                                                    alt={producto.nombre}
                                                    className="w-12 h-12 rounded-lg object-cover border border-border"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                                                    <Beer className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>

                                        {/* Name */}
                                        <TableCell className="font-semibold text-foreground">
                                            {producto.nombre}
                                        </TableCell>

                                        {/* Category */}
                                        <TableCell>
                                            <Badge variant="secondary" className="font-medium text-xs">
                                                {categoria}
                                            </Badge>
                                        </TableCell>

                                        {/* Description */}
                                        <TableCell className="hidden md:table-cell text-muted-foreground max-w-xs truncate">
                                            {descripcionReal || "—"}
                                        </TableCell>

                                        {/* Price */}
                                        <TableCell className="font-medium">
                                            ${producto.precio.toLocaleString("es-CL")}
                                        </TableCell>

                                        {/* Stock (Quick adjustments) */}
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleQuickStockAdjust(producto.id, -1)}
                                                    disabled={producto.stock === 0 || ajustarStockMutation.isPending}
                                                >
                                                    <MinusCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                </Button>

                                                <span
                                                    className={`w-10 text-center font-bold font-mono text-sm ${
                                                        isLowStock
                                                            ? "text-destructive underline decoration-dotted"
                                                            : "text-foreground"
                                                    }`}
                                                    title={isLowStock ? "Stock bajo" : undefined}
                                                >
                                                    {producto.stock}
                                                </span>

                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => handleQuickStockAdjust(producto.id, 1)}
                                                    disabled={ajustarStockMutation.isPending}
                                                >
                                                    <PlusCircle className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() => setStockAjusteId(producto.id)}
                                                >
                                                    Ajustar
                                                </Button>
                                            </div>
                                        </TableCell>

                                        {/* Availability (clickable Toggle) */}
                                        <TableCell className="text-center">
                                            <button
                                                onClick={() => toggleDisponibilidadMutation.mutate(producto.id)}
                                                disabled={toggleDisponibilidadMutation.isPending}
                                                className="focus:outline-none hover:scale-105 active:scale-95 transition-transform"
                                                title="Haz clic para cambiar disponibilidad"
                                            >
                                                {producto.disponible ? (
                                                    <Badge variant="success" className="cursor-pointer">
                                                        Disponible
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="cursor-pointer">
                                                        Agotado
                                                    </Badge>
                                                )}
                                            </button>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => navigate(`/productos/${producto.id}/editar`)}
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setEliminarId(producto.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Modal: Delete Confirmation */}
            <Dialog open={!!eliminarId} onOpenChange={(o) => !o && setEliminarId(null)}>
                <DialogContent onClose={() => setEliminarId(null)}>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar producto?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el producto{" "}
                            <strong>{productoAEliminar?.nombre}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEliminarId(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => eliminarId && eliminarMutation.mutate(eliminarId)}
                            disabled={eliminarMutation.isPending}
                        >
                            {eliminarMutation.isPending ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Custom Stock Adjustment */}
            <Dialog open={!!stockAjusteId} onOpenChange={(o) => !o && setStockAjusteId(null)}>
                <DialogContent onClose={() => setStockAjusteId(null)}>
                    <DialogHeader>
                        <DialogTitle>Ajustar Stock</DialogTitle>
                        <DialogDescription>
                            Ajusta el stock de <strong>{productoAjustarStock?.nombre}</strong>.
                            Usa valores positivos para agregar stock y negativos para restar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
                            <span className="text-sm font-medium text-muted-foreground">Stock actual:</span>
                            <span className="text-lg font-bold font-mono">{productoAjustarStock?.stock}</span>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cantidadAjuste">Cantidad a cambiar (ej. +10, -5)</Label>
                            <Input
                                id="cantidadAjuste"
                                type="number"
                                placeholder="Ej: 20 o -15"
                                value={cantidadAjuste}
                                onChange={(e) => setCantidadAjuste(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 justify-center">
                            <Button variant="outline" size="sm" onClick={() => setCantidadAjuste("10")}>
                                +10
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCantidadAjuste("50")}>
                                +50
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCantidadAjuste("-10")}>
                                -10
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setCantidadAjuste("-50")}>
                                -50
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStockAjusteId(null)
                                setCantidadAjuste("")
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                const val = parseInt(cantidadAjuste, 10)
                                if (Number.isNaN(val)) {
                                    toast.error("Por favor ingresa un número válido")
                                    return
                                }
                                if (stockAjusteId) {
                                    ajustarStockMutation.mutate({ id: stockAjusteId, cantidad: val })
                                }
                            }}
                            disabled={ajustarStockMutation.isPending}
                        >
                            {ajustarStockMutation.isPending ? "Actualizando..." : "Aplicar Ajuste"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}