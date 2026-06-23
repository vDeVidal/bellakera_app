import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post,
  UploadedFile, UseGuards, UseInterceptors, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { GaleriaService } from './galeria.service';
import { CreateGaleriaDto } from './dto/galeria.dto';

const galeriaStorage = diskStorage({
  destination: './uploads/galeria',
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

@Controller('galeria')
@UseGuards(AuthGuard('jwt'))
export class GaleriaController {
  constructor(private readonly galeria: GaleriaService) {}

  @Get()
  listar(@Req() req: any) {
    // Solo usuarios "normales" tienen liked_by_me; admin también funciona pero usa su id
    const idActual = req.user.sub;
    return this.galeria.listarFeed(idActual);
  }

  @Post()
  @UseInterceptors(FileInterceptor('imagen', { storage: galeriaStorage }))
  subir(
    @Body() body: CreateGaleriaDto,
    @UploadedFile() imagen: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!imagen) {
      throw new Error('Debes enviar una imagen');
    }
    // Solo usuarios suben (no admins). Si quieres permitir admins también, quita esto:
    if (req.user.tipo !== 'usuario') {
      throw new Error('Solo los usuarios pueden subir imágenes');
    }
    const url = `/uploads/galeria/${imagen.filename}`;
    return this.galeria.crear(req.user.sub, url, body.descripcion, body.id_evento);
  }

  @Post(':id/like')
  toggleLike(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.galeria.toggleLike(id, req.user.sub);
  }

  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.galeria.eliminar(id, req.user);
  }
}