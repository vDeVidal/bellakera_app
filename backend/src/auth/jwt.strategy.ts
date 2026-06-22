import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy {
  constructor(private jwt: JwtService) {}

  validateRequest(req: Request): any {
    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token requerido');
    }
    const token = auth.split(' ')[1];
    try {
      return this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}