import {
    Controller, Get, Post, Patch, Delete, Param, Body,
    UseInterceptors, UploadedFile, UseGuards, Query, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

const storage = diskStorage({
    destination: './uploads/productos',
    filename: (_req, file, cb) => {
        cb(null, `${uuidv4()}${extname(file.originalname)}`);
    },
});

@Controller('productos')
export class ProductosController {
    constructor(private readonly productosService: ProductosService) { }

    @Get()
    findAll(@Query('disponibles') disponibles?: string) {
        return this.productosService.findAll(disponibles === 'true');
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productosService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Post()
    @UseInterceptors(FileInterceptor('imagen', { storage }))
    create(
        @Body() dto: CreateProductoDto,
        @UploadedFile() imagen?: Express.Multer.File,
    ) {
        const imagen_url = imagen ? `/uploads/productos/${imagen.filename}` : undefined;
        return this.productosService.create(dto, imagen_url);
    }

    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Patch(':id')
    @UseInterceptors(FileInterceptor('imagen', { storage }))
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductoDto,
        @UploadedFile() imagen?: Express.Multer.File,
    ) {
        const imagen_url = imagen ? `/uploads/productos/${imagen.filename}` : undefined;
        return this.productosService.update(id, dto, imagen_url);
    }

    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productosService.remove(id);
    }

    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Patch(':id/toggle-disponibilidad')
    toggle(@Param('id', ParseIntPipe) id: number) {
        return this.productosService.toggleDisponibilidad(id);
    }

    @UseGuards(AuthGuard('jwt'), AdminGuard)
    @Patch(':id/stock')
    ajustarStock(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateStockDto,
    ) {
        return this.productosService.ajustarStock(id, dto.cantidad);
    }
}