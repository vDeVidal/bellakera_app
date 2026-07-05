import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';

@Controller('ventas')
@UseGuards(JwtAuthGuard)
export class VentasController {
    constructor(private readonly ventasService: VentasService) { }

    // Crear venta (usuario autenticado)
    @Post()
    create(@Req() req: any, @Body() dto: CreateVentaDto) {
        return this.ventasService.create(req.user.id, dto);
    }

    // Listar ventas (solo admin)
    @Get()
    @UseGuards(AdminGuard)
    findAll(
        @Query('eventoId') eventoId?: string,
        @Query('estado') estado?: string,
        @Query('tipo') tipo?: string,
    ) {
        return this.ventasService.findAll({ eventoId, estado, tipo });
    }

    // Cola de ventas (solo admin)
    @Get('cola')
    @UseGuards(AdminGuard)
    getCola(@Query('eventoId') eventoId?: string) {
        return this.ventasService.getCola(eventoId);
    }

    // Mis ventas (usuario autenticado)
    @Get('mis-ventas')
    getMisVentas(@Req() req: any) {
        return this.ventasService.getMisVentas(req.user.id);
    }

    // Reporte de evento (solo admin)
    @Get('reporte/:eventoId')
    @UseGuards(AdminGuard)
    reporteEvento(@Param('eventoId') eventoId: string) {
        return this.ventasService.reporteEvento(eventoId);
    }

    // Detalle de venta
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.ventasService.findOne(id);
    }

    // Actualizar estado (solo admin)
    @Patch(':id/estado')
    @UseGuards(AdminGuard)
    updateEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
        return this.ventasService.updateEstado(id, dto);
    }

    // Cancelar venta
    @Patch(':id/cancelar')
    cancelar(@Req() req: any, @Param('id') id: string) {
        const esAdmin = req.user.tipo === 'admin';
        return this.ventasService.cancelar(id, req.user.id, esAdmin);
    }
}