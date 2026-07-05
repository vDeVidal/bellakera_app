import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@Injectable()
export class ProductosService {
    constructor(private prisma: PrismaService) { }

    async findAll(soloDisponibles = false) {
        return this.prisma.producto.findMany({
            where: soloDisponibles ? { disponible: true } : undefined,
            orderBy: { nombre: 'asc' },
        });
    }

    async findOne(id: number) {
        const producto = await this.prisma.producto.findUnique({ where: { id } });
        if (!producto) throw new NotFoundException('Producto no encontrado');
        return producto;
    }

    async create(dto: CreateProductoDto, imagen_url?: string) {
        return this.prisma.producto.create({
            data: {
                nombre: dto.nombre,
                descripcion: dto.descripcion,
                precio: dto.precio,
                stock: dto.stock ?? 0,
                disponible: dto.disponible ?? true,
                imagen_url,
            },
        });
    }

    async update(id: number, dto: UpdateProductoDto, imagen_url?: string) {
        await this.findOne(id);
        return this.prisma.producto.update({
            where: { id },
            data: {
                ...dto,
                ...(imagen_url && { imagen_url }),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.producto.delete({ where: { id } });
    }

    async toggleDisponibilidad(id: number) {
        const p = await this.findOne(id);
        return this.prisma.producto.update({
            where: { id },
            data: { disponible: !p.disponible },
        });
    }

    async ajustarStock(id: number, cantidad: number) {
        const p = await this.findOne(id);
        const nuevoStock = p.stock + cantidad;
        if (nuevoStock < 0) throw new BadRequestException('Stock insuficiente');
        return this.prisma.producto.update({
            where: { id },
            data: { stock: nuevoStock },
        });
    }
}