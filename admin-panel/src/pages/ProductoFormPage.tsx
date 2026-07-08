import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Upload, X } from "lucide-react"
import { toast } from "sonner"

import { productosApi, ProductoInput } from "@/api/productos"
import { buildImageUrl } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

const CATEGORIES = ["Tragos", "Cervezas", "Sin Alcohol", "Comida", "Otros"]

// Helper functions for category parsing & serialization
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

function serializeDescription(categoria: string, descripcionReal: string) {
    const cleanCat = categoria || "Otros"
    const cleanDesc = descripcionReal ? descripcionReal.trim() : ""
    return `${cleanCat} | ${cleanDesc}`
}

const productoSchema = z.object({
    nombre: z.string().min(3, "Mínimo 3 caracteres"),
    categoria: z.string().min(1, "Categoría requerida"),
    descripcionReal: z.string().optional(),
    precio: z.number({ invalid_type_error: "Precio requerido" })
        .int("Debe ser un entero")
        .min(1, "El precio debe ser mayor a 0"),
    stock: z.number({ invalid_type_error: "Stock requerido" })
        .int()
        .min(0, "El stock no puede ser negativo"),
    disponible: z.boolean(),
})

type ProductoFormData = z.infer<typeof productoSchema>

export function ProductoFormPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const queryClient = useQueryClient()
    const isEdit = !!id

    const [imagenFile, setImagenFile] = useState<File | null>(null)
    const [imagenPreview, setImagenPreview] = useState<string | null>(null)

    const { data: producto, isLoading } = useQuery({
        queryKey: ["producto", id],
        queryFn: () => productosApi.get(Number(id)),
        enabled: isEdit,
    })

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ProductoFormData>({
        resolver: zodResolver(productoSchema),
        defaultValues: {
            nombre: "",
            categoria: "Otros",
            descripcionReal: "",
            precio: undefined as any,
            stock: 0,
            disponible: true,
        },
    })

    useEffect(() => {
        if (producto) {
            const { categoria, descripcionReal } = parseDescription(producto.descripcion)
            reset({
                nombre: producto.nombre,
                categoria: CATEGORIES.includes(categoria) ? categoria : "Otros",
                descripcionReal,
                precio: producto.precio,
                stock: producto.stock,
                disponible: producto.disponible,
            })
            if (producto.imagen_url) {
                setImagenPreview(buildImageUrl(producto.imagen_url) || null)
            }
        }
    }, [producto, reset])

    const crearMutation = useMutation({
        mutationFn: (data: ProductoInput) => productosApi.create(data, imagenFile ?? undefined),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["productos"] })
            toast.success("Producto creado con éxito")
            navigate("/productos")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al crear el producto")
        },
    })

    const actualizarMutation = useMutation({
        mutationFn: (data: Partial<ProductoInput>) =>
            productosApi.update(Number(id), data, imagenFile ?? undefined),
        onSuccess: async () => {
            await queryClient.refetchQueries({ queryKey: ["productos"] })
            queryClient.removeQueries({ queryKey: ["producto", id] })
            toast.success("Producto actualizado con éxito")
            navigate("/productos")
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? "Error al actualizar el producto")
        },
    })

    const onSubmit = (data: ProductoFormData) => {
        const descSerializado = serializeDescription(data.categoria, data.descripcionReal ?? "")
        const input: ProductoInput = {
            nombre: data.nombre,
            descripcion: descSerializado,
            precio: data.precio,
            stock: data.stock,
            disponible: data.disponible,
        }

        if (isEdit) {
            actualizarMutation.mutate(input)
        } else {
            crearMutation.mutate(input)
        }
    }

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImagenFile(file)
            setImagenPreview(URL.createObjectURL(file))
        }
    }

    const clearImagen = () => {
        setImagenFile(null)
        setImagenPreview(producto?.imagen_url ? buildImageUrl(producto.imagen_url) || null : null)
    }

    if (isEdit && isLoading) {
        return <div className="text-muted-foreground p-6">Cargando producto...</div>
    }

    const isSubmitting = crearMutation.isPending || actualizarMutation.isPending

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate("/productos")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver
                </Button>
                <h1 className="text-2xl font-bold">
                    {isEdit ? "Editar Producto" : "Nuevo Producto"}
                </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 rounded-lg border border-border bg-card p-6">
                    {/* Imagen del producto */}
                    <div className="space-y-2">
                        <Label>Imagen del Producto</Label>
                        <div className="flex items-start gap-4">
                            {imagenPreview ? (
                                <div className="relative">
                                    <img
                                        src={imagenPreview}
                                        alt="Preview"
                                        className="w-40 h-40 rounded-lg object-cover border border-border"
                                    />
                                    <button
                                        type="button"
                                        onClick={clearImagen}
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
                                    onChange={handleImagenChange}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Nombre del producto */}
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input id="nombre" {...register("nombre")} placeholder="Ej: Pisco Mistral Alto del Carmen" />
                        {errors.nombre && (
                            <p className="text-xs text-destructive">{errors.nombre.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Categoría */}
                        <div className="space-y-2">
                            <Label htmlFor="categoria">Categoría *</Label>
                            <Select id="categoria" {...register("categoria")}>
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </Select>
                            {errors.categoria && (
                                <p className="text-xs text-destructive">{errors.categoria.message}</p>
                            )}
                        </div>

                        {/* Disponibilidad */}
                        <div className="space-y-2 flex flex-col justify-end pb-2">
                            <div className="flex items-center gap-2">
                                <input
                                    id="disponible"
                                    type="checkbox"
                                    {...register("disponible")}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="disponible" className="cursor-pointer">
                                    Disponible para la venta
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Precio en CLP */}
                        <div className="space-y-2">
                            <Label htmlFor="precio">Precio (CLP) *</Label>
                            <Input
                                id="precio"
                                type="number"
                                {...register("precio", { valueAsNumber: true })}
                                placeholder="Ej: 5000"
                            />
                            {errors.precio && (
                                <p className="text-xs text-destructive">{errors.precio.message}</p>
                            )}
                        </div>

                        {/* Stock inicial */}
                        <div className="space-y-2">
                            <Label htmlFor="stock">Stock *</Label>
                            <Input
                                id="stock"
                                type="number"
                                {...register("stock", { valueAsNumber: true })}
                                placeholder="Ej: 100"
                            />
                            {errors.stock && (
                                <p className="text-xs text-destructive">{errors.stock.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2">
                        <Label htmlFor="descripcionReal">Descripción</Label>
                        <Textarea
                            id="descripcionReal"
                            {...register("descripcionReal")}
                            placeholder="Breve descripción del producto..."
                            rows={3}
                        />
                        {errors.descripcionReal && (
                            <p className="text-xs text-destructive">{errors.descripcionReal.message}</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/productos")}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? isEdit
                                ? "Guardando..."
                                : "Creando..."
                            : isEdit
                            ? "Guardar Cambios"
                            : "Crear Producto"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
