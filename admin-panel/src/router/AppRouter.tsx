import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ProtectedRoute } from "./ProtectedRoute"
import { AppLayout } from "@/components/layout/AppLayout"
import { LoginPage } from "@/pages/LoginPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { EventosPage } from "@/pages/eventos/EventosPage"
import { EventoFormPage } from "@/pages/eventos/EventoFormPage"
import { EventoDetallePage } from "@/pages/eventos/EventoDetallePage"
import { ProductosPage } from "@/pages/ProductosPage"
import { ProductoFormPage } from "@/pages/ProductoFormPage"
import { ColaPage } from "@/pages/ColaPage"
import { VentasPage } from "@/pages/VentasPage"
import { MinijuegosPage } from "@/pages/MinijuegosPage"

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta pública */}
                <Route path="/login" element={<LoginPage />} />

                {/* Rutas protegidas */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Eventos */}
                    <Route path="/eventos" element={<EventosPage />} />
                    <Route path="/eventos/nuevo" element={<EventoFormPage />} />
                    <Route path="/eventos/:id" element={<EventoDetallePage />} />
                    <Route path="/eventos/:id/editar" element={<EventoFormPage />} />

                    {/* Otros módulos */}
                    <Route path="/productos" element={<ProductosPage />} />
                    <Route path="/productos/nuevo" element={<ProductoFormPage />} />
                    <Route path="/productos/:id/editar" element={<ProductoFormPage />} />
                    <Route path="/cola" element={<ColaPage />} />
                    <Route path="/ventas" element={<VentasPage />} />
                    <Route path="/minijuegos" element={<MinijuegosPage />} />
                </Route>

                {/* Redirección raíz */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    )
}