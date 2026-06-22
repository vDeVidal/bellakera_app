import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { GaleriaService } from './galeria.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('galeria')
@UseGuards(AuthGuard)
export class GaleriaController {
  constructor(private galeria: GaleriaService) {}

  @Get()
  listar() {
    return this.galeria.listar();
  }

  @Get('mias')
  mias(@Req() req: any) {
    return this.galeria.listarPorUsuario(req.user.sub);
  }

  @Post()
  subir(@Req() req: any, @Body() data: any) {
    return this.galeria.subir(req.user.sub, data);
  }

  @Delete(':id')
  eliminar(@Req() req: any, @Param('id') id: string) {
    return this.galeria.eliminar(req.user.sub, +id);
  }

  @Post(':id/like')
  like(@Req() req: any, @Param('id') id: string) {
    return this.galeria.toggleLike(req.user.sub, +id);
  }
}