import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post,
  UploadedFile, UseGuards, UseInterceptors, Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import { EventosService } from './eventos.service';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

const flyerStorage = diskStorage({
  destination: './uploads/eventos',
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventos: EventosService) {}

  // 📋 LISTAR — todos autenticados
  @UseGuards(AuthGuard('jwt'))
  @Get()
  listar() {
    return this.eventos.listar();
  }

  // 👁️ DETALLE — todos autenticados
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.eventos.obtener(id);
  }

  // ➕ CREAR — solo admin
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post()
  @UseInterceptors(FileInterceptor('flyer', { storage: flyerStorage }))
  crear(
    @Body() body: CreateEventoDto,
    @UploadedFile() flyer: Express.Multer.File,
    @Req() req: any,
  ) {
    const flyerPath = flyer ? `/uploads/eventos/${flyer.filename}` : null;
    return this.eventos.crear(body, flyerPath, req.user.sub);
  }

  // ✏️ EDITAR — solo admin
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('flyer', { storage: flyerStorage }))
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEventoDto,
    @UploadedFile() flyer: Express.Multer.File,
  ) {
    const flyerPath = flyer ? `/uploads/eventos/${flyer.filename}` : null;
    return this.eventos.actualizar(id, body, flyerPath);
  }

  // 🗑️ ELIMINAR — solo admin
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete(':id')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.eventos.eliminar(id);
  }
}