import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    return req.user;
  }
  @Post('registro')
  registro(@Body() body: {
    telefono: string;
    pin: string;
    nombre: string;
    apellido: string;
    fecha_nacimiento?: string;
  }) {
    return this.auth.registro(body);
  }

  @Post('verificar')
  verificar(@Body() body: { telefono: string; codigo: string }) {
    return this.auth.verificar(body.telefono, body.codigo);
  }

  @Post('login')
  login(@Body() body: { telefono: string; pin: string }) {
    return this.auth.login(body.telefono, body.pin);
  }

  @Post('reenviar-codigo')
  reenviarCodigo(@Body() body: { telefono: string }) {
    return this.auth.reenviarCodigo(body.telefono);
  }
}