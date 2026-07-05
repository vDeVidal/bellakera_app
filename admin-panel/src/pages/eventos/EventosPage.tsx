import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Eye, Pencil, Trash2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { eventosApi, Evento } from "@/api/eventos"
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

function estadoBadge(estado: Evento["estado"]) {
    switch (estado) {
        case "ACTIVO":
            return <Badge variant="success">Activo</Badge>
        case "CERRADO":
            return <Badge variant="secondary">Cerrado</Badge>
        case "CANCELADO":
            return <Badge variant="destructive">Cancelado</Badge>
    }
}

export function EventosPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [busqueda, setBusqueda] = useState("")
    const [estadoFiltro, setEstadoFiltro] = useState<string>("TODOS")
    const [eliminarId, setEliminarId] = useState<number | null>(null)

    const { data: eventos = [], isLoading } = useQuery({
        queryKey: ["eventos"],
        queryFn: eventosApi.list,
    })

    const eliminarMutation = useMutation({
        mutationFn: (id: number) => eventosApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["eventos"] })
            toast.success("Evento eliminado")
            setEliminarId(null)
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al eliminar")
        },
    })

    const eventosFiltrados = eventos.filter((e) => {
        const matchesBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase())
        const matchesEstado = estadoFiltro === "TODOS" || e.estado === estadoFiltro
        return matchesBusqueda && matchesEstado
    })

    const eventoAEliminar = eventos.find((e) => e.id === eliminarId)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Eventos</h1>
                    <p className="text-muted-foreground">Gestiona los eventos del club</p>
                </div>
                <Button onClick={() => navigate("/eventos/nuevo")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo evento
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="sm:w-48"
                >
                    <option value="TODOS">Todos los estados</option>
                    <option value="ACTIVO">Activo</option>
                    <option value="CERRADO">Cerrado</option>
                    <option value="CANCELADO">Cancelado</option>
                </Select>
            </div>

            <div className="rounded-lg border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-20">Flyer</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Aforo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Cargando eventos...
                                </TableCell>
                            </TableRow>
                        ) : eventosFiltrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    No hay eventos que coincidan
                                </TableCell>
                            </TableRow>
                        ) : (
                            eventosFiltrados.map((evento) => (
                                <TableRow key={evento.id}>
                                    <TableCell>
                                        {evento.imagen_url ? (
                                            <img
                                                src={buildImageUrl(evento.imagen_url)}
                                                alt={evento.nombre}
                                                className="w-12 h-12 rounded object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-medium">{evento.nombre}</TableCell>
                                    <TableCell>
                                        {format(new Date(evento.fecha), "dd MMM yyyy, HH:mm", { locale: es })}
                                    </TableCell>
                                    <TableCell>${evento.precio.toLocaleString("es-CL")}</TableCell>
                                    <TableCell>{evento.aforo_maximo}</TableCell>
                                    <TableCell>{estadoBadge(evento.estado)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => navigate(`/eventos/${evento.id}`)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => navigate(`/eventos/${evento.id}/editar`)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEliminarId(evento.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!eliminarId} onOpenChange={(o) => !o && setEliminarId(null)}>
                <DialogContent onClose={() => setEliminarId(null)}>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar evento?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el evento{" "}
                            <strong>{eventoAEliminar?.nombre}</strong>.
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
        </div>
    )
}