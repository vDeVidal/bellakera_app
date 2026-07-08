import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { eventosApi, EventoInput } from "@/api/eventos"
import { buildImageUrl } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

// 1️⃣ Cambia el schema: quita coerce (ya no lo necesitas)
const eventoSchema = z.object({
    nombre: z.string().min(3, "Mínimo 3 caracteres"),
    descripcion: z.string().optional(),
    fecha: z.string().min(1, "Fecha requerida"),
    precio: z.number({ invalid_type_error: "Precio requerido" })
        .int("Debe ser un entero")
        .min(1, "El precio debe ser mayor a 0"),
    aforo_maximo: z.number({ invalid_type_error: "Aforo requerido" })
        .int()
        .min(1, "Aforo mínimo 1"),
    estado: z.enum(["ACTIVO", "CERRADO", "CANCELADO"]),
})

type EventoFormData = z.infer<typeof eventoSchema>

export function EventoFormPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const queryClient = useQueryClient()
    const isEdit = !!id

    const [flyer, setFlyer] = useState<File | null>(null)
    const [flyerPreview, setFlyerPreview] = useState<string | null>(null)

    const { data: evento, isLoading } = useQuery({
        queryKey: ["evento", id],
        queryFn: () => eventosApi.get(Number(id)),
        enabled: isEdit,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<EventoFormData>({
        resolver: zodResolver(eventoSchema),
        defaultValues: {
            nombre: "",
            descripcion: "",
            fecha: "",
            precio: undefined as any,        // que arranque vacío, no 0
            aforo_maximo: undefined as any,
            estado: "ACTIVO",
        },
    })

    useEffect(() => {
        if (evento) {
            reset({
                nombre: evento.nombre,
                descripcion: evento.descripcion ?? "",
                fecha: evento.fecha.slice(0, 16), // yyyy-MM-ddTHH:mm
                precio: evento.precio,
                aforo_maximo: evento.aforo_maximo ?? 100,
                estado: evento.estado,
            })
            if (evento.imagen_url) {
                setFlyerPreview(buildImageUrl(evento.imagen_url) || null)
            }
        }
    }, [evento, reset])

    const crearMutation = useMutation({
        mutationFn: (data: EventoInput) => eventosApi.create(data, flyer ?? undefined),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["eventos"] })
            toast.success("Evento creado")
            navigate("/eventos")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al crear")
        },
    })

    const actualizarMutation = useMutation({
        mutationFn: (data: Partial<EventoInput>) =>
            eventosApi.update(Number(id), data, flyer ?? undefined),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["eventos"] })
            queryClient.removeQueries({ queryKey: ["evento", id] })
            toast.success("Evento actualizado")
            navigate("/eventos")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al actualizar")
        },
    })

    const onSubmit = (data: EventoFormData) => {
        const input: EventoInput = {
            ...data,
            fecha: new Date(data.fecha).toISOString(),
        }
        if (isEdit) {
            actualizarMutation.mutate(input)
        } else {
            crearMutation.mutate(input)
        }
    }

    const handleFlyerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFlyer(file)
            setFlyerPreview(URL.createObjectURL(file))
        }
    }

    const clearFlyer = () => {
        setFlyer(null)
        setFlyerPreview(evento?.imagen_url ? buildImageUrl(evento.imagen_url) || null : null)
    }

    if (isEdit && isLoading) {
        return <div className="text-muted-foreground">Cargando...</div>
    }

    const isSubmitting = crearMutation.isPending || actualizarMutation.isPending

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate("/eventos")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                </Button>
                <h1 className="text-2xl font-bold">
                    {isEdit ? "Editar evento" : "Nuevo evento"}
                </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-card p-6">
                    <div className="space-y-2">
                        <Label>Flyer</Label>
                        <div className="flex items-start gap-4">
                            {flyerPreview ? (
                                <div className="relative">
                                    <img
                                        src={flyerPreview}
                                        alt="Preview"
                                        className="w-40 h-40 rounded-lg object-cover border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearFlyer}
                                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-40 h-40 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                            <label className="cursor-pointer">
                                <span className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent">
                                    <Upload className="w-4 h-4 mr-2" />
                                    Seleccionar imagen
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFlyerChange}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input id="nombre" {...register("nombre")} placeholder="Ej: Bellakera Night" />
                        {errors.nombre && (
                            <p className="text-xs text-destructive">{errors.nombre.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="descripcion">Descripción</Label>
                        <Textarea
                            id="descripcion"
                            {...register("descripcion")}
                            placeholder="Detalles del evento..."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fecha">Fecha y hora *</Label>
                            <Input id="fecha" type="datetime-local" {...register("fecha")} />
                            {errors.fecha && (
                                <p className="text-xs text-destructive">{errors.fecha.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select id="estado" {...register("estado")}>
                                <option value="ACTIVO">Activo</option>
                                <option value="CERRADO">Cerrado</option>
                                <option value="CANCELADO">Cancelado</option>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="precio">Precio (CLP) *</Label>
                            <Input
                                id="precio"
                                type="number"
                                step="any"
                                min={1}
                                {...register("precio", { valueAsNumber: true })}    // ← clave
                                placeholder="10000"
                            />

                            {errors.precio && (
                                <p className="text-xs text-destructive">{errors.precio.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="aforo_maximo">Aforo máximo *</Label>
                            <Input
                                id="aforo_maximo"
                                type="number"
                                step="any"
                                min={1}
                                {...register("aforo_maximo", { valueAsNumber: true })}   // ← clave
                                placeholder="300"
                            />
                            {errors.aforo_maximo && (
                                <p className="text-xs text-destructive">{errors.aforo_maximo.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => navigate("/eventos")}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear evento"}
                    </Button>
                </div>
            </form>
        </div>
    )
}