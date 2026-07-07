import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

// Estado en memoria — no requiere BD
let juegoActivo = false;
let juegoActivadoEn: Date | null = null;

@Controller('config')
export class ConfigController {
    // Cualquier usuario autenticado puede consultar el estado del juego
    @UseGuards(JwtAuthGuard)
    @Get('juego')
    getJuego() {
        return {
            juego_activo: juegoActivo,
            activado_en: juegoActivadoEn,
        };
    }

    // Solo admin puede activar/desactivar el juego
    @UseGuards(JwtAuthGuard, AdminGuard)
    @Patch('juego')
    setJuego(@Body() body: { activo: boolean }) {
        juegoActivo = !!body.activo;
        juegoActivadoEn = juegoActivo ? new Date() : null;
        return {
            juego_activo: juegoActivo,
            activado_en: juegoActivadoEn,
        };
    }
}
