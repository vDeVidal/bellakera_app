import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('usuarios')
@UseGuards(AuthGuard)
export class UsuariosController {
  constructor(private usuarios: UsuariosService) {}

  @Get('me')
  perfil(@Req() req: any) {
    return this.usuarios.getPerfil(req.user.sub);
  }

  @Put('me')
  actualizar(@Req() req: any, @Body() data: any) {
    return this.usuarios.actualizarPerfil(req.user.sub, data);
  }

  @Get('me/red-social')
  getRedSocial(@Req() req: any) {
    return this.usuarios.getRedSocial(req.user.sub);
  }

  @Put('me/red-social')
  upsertRedSocial(@Req() req: any, @Body() data: any) {
    return this.usuarios.upsertRedSocial(req.user.sub, data);
  }
}