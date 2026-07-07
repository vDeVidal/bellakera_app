import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, PlayCircle, StopCircle, Zap } from "lucide-react"

interface EstadoJuego {
    juego_activo: boolean
    activado_en: string | null
}

async function fetchEstadoJuego(): Promise<EstadoJuego> {
    const { data } = await api.get("/config/juego")
    return data
}

async function setEstadoJuego(activo: boolean): Promise<EstadoJuego> {
    const { data } = await api.patch("/config/juego", { activo })
    return data
}

export function MinijuegosPage() {
    const qc = useQueryClient()

    const { data, isLoading } = useQuery<EstadoJuego>({
        queryKey: ["config-juego"],
        queryFn: fetchEstadoJuego,
        refetchInterval: 5000,
    })

    const mutation = useMutation({
        mutationFn: setEstadoJuego,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["config-juego"] }),
    })

    const activo = data?.juego_activo ?? false

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-3">
                <Gamepad2 className="h-7 w-7 text-bellakera" />
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Minijuegos</h1>
                    <p className="text-sm text-muted-foreground">
                        Activa el minijuego en vivo para los usuarios de la app móvil
                    </p>
                </div>
            </div>

            {/* Estado actual */}
            <Card className={`border-2 ${activo ? "border-green-500/50 bg-green-500/5" : "border-border"}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Zap className={`h-5 w-5 ${activo ? "text-green-400" : "text-muted-foreground"}`} />
                            Fruit Catcher 🍓
                        </CardTitle>
                        <Badge variant={activo ? "default" : "secondary"}
                            className={activo ? "bg-green-500 text-white animate-pulse" : ""}>
                            {activo ? "🟢 ACTIVO EN APP" : "⚫ INACTIVO"}
                        </Badge>
                    </div>
                    <CardDescription>
                        Los jugadores atrapan frutas que caen en pantalla durante 30 segundos.
                        Cuando está activo, el botón de juego en la app móvil destella y se puede presionar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {activo && data?.activado_en && (
                        <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                            ✅ Juego activado el{" "}
                            {new Date(data.activado_en).toLocaleString("es-CL", {
                                dateStyle: "medium",
                                timeStyle: "short",
                            })}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={() => mutation.mutate(true)}
                            disabled={activo || mutation.isPending || isLoading}
                            className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <PlayCircle className="h-4 w-4" />
                            Activar juego en app
                        </Button>
                        <Button
                            onClick={() => mutation.mutate(false)}
                            disabled={!activo || mutation.isPending || isLoading}
                            variant="destructive"
                            className="flex-1 gap-2"
                        >
                            <StopCircle className="h-4 w-4" />
                            Desactivar juego
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Instrucciones */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">¿Cómo funciona?</CardTitle>
                </CardHeader>
                <CardContent>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Presiona <strong className="text-foreground">"Activar juego en app"</strong> para encender el minijuego.</li>
                        <li>En la app móvil, el botón de <strong className="text-foreground">Juegos</strong> comenzará a parpadear.</li>
                        <li>Los usuarios presionan el botón y aparece el juego <strong className="text-foreground">Fruit Catcher</strong>.</li>
                        <li>El juego dura <strong className="text-foreground">30 segundos</strong>. Cada fruta atrapada vale 10 puntos.</li>
                        <li>Al terminar, se muestra el puntaje y pueden volver al inicio.</li>
                        <li>Presiona <strong className="text-foreground">"Desactivar"</strong> cuando quieras terminar la dinámica.</li>
                    </ol>
                </CardContent>
            </Card>
        </div>
    )
}
