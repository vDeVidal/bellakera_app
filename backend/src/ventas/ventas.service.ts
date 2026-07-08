import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VentasService {
    constructor(private prisma: PrismaService) { }

    async create(usuarioId: string, dto: CreateVentaDto) {
        // Validar que hay al menos un item
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('La venta debe tener al menos un item');
        }

        // Validar evento existe y está activo
        const evento = await this.prisma.evento.findUnique({
            where: { id: dto.evento_id },
        });
        if (!evento) {
            throw new NotFoundException('Evento no encontrado');
        }
        if (evento.estado !== 'ACTIVO') {
            throw new BadRequestException('El evento no está activo');
        }

        // Transacción atómica: validar stock, calcular total, crear venta, descontar stock
        return this.prisma.$transaction(async (tx) => {
            let total = 0;
            const detallesData: Array<{
                producto_id: number | null;
                nombre_snapshot: string;
                cantidad: number;
                precio_unitario: number;
                subtotal: number;
                estado: string;
                notas?: string;
            }> = [];

            // Procesar cada item
            for (const item of dto.items) {
                if (dto.tipo_venta === 'ENTRADA') {
                    // Entrada: usar precio del evento
                    if (evento.precio === null || evento.precio === undefined) {
                        throw new BadRequestException(
                            'El evento no tiene precio configurado',
                        );
                    }
                    const subtotal = evento.precio * item.cantidad;
                    total += subtotal;
                    detallesData.push({
                        producto_id: null,
                        nombre_snapshot: `Entrada - ${evento.nombre}`,
                        cantidad: item.cantidad,
                        precio_unitario: evento.precio,
                        subtotal,
                        estado: 'entregado',
                        notas: item.notas,
                    });
                } else if (dto.tipo_venta === 'BEBIDA') {
                    // Bebida: validar producto y stock
                    if (!item.producto_id) {
                        throw new BadRequestException(
                            'producto_id requerido para items tipo BEBIDA',
                        );
                    }
                    const producto = await tx.producto.findUnique({
                        where: { id: item.producto_id },
                    });
                    if (!producto) {
                        throw new NotFoundException(
                            `Producto ${item.producto_id} no encontrado`,
                        );
                    }
                    if (!producto.disponible) {
                        throw new BadRequestException(
                            `Producto ${producto.nombre} no está disponible`,
                        );
                    }
                    if (producto.stock < item.cantidad) {
                        throw new BadRequestException(
                            `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
                        );
                    }

                    // Descontar stock atómicamente
                    await tx.producto.update({
                        where: { id: producto.id },
                        data: { stock: { decrement: item.cantidad } },
                    });

                    const subtotal = producto.precio * item.cantidad;
                    total += subtotal;
                    detallesData.push({
                        producto_id: producto.id,
                        nombre_snapshot: producto.nombre,
                        cantidad: item.cantidad,
                        precio_unitario: producto.precio,
                        subtotal,
                        estado: 'pendiente',
                        notas: item.notas,
                    });
                }
            }

            // Generar QR code único (para entradas)
            const qrCode = `BELL-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 10)
                .toUpperCase()}`;

            // Crear venta con detalles
            const venta = await tx.venta.create({
                data: {
                    usuario_id: +usuarioId,
                    evento_id: dto.evento_id!,
                    tipo_venta: dto.tipo_venta,
                    total,
                    estado: dto.tipo_venta === 'ENTRADA' ? 'pagado' : 'pendiente',
                    metodo_pago: dto.metodo_pago || 'app',
                    notas: dto.notas,
                    qr_code: dto.tipo_venta === 'ENTRADA' ? qrCode : null,
                    qr_escaneado: false,
                    detalles: {
                        create: detallesData,
                    },
                },
                include: {
                    detalles: {
                        include: {
                            producto: true,
                        },
                    },
                    usuario: {
                        select: {
                            id: true,
                            nombre: true,
                            telefono: true,
                        },
                    },
                    evento: {
                        select: {
                            id: true,
                            nombre: true,
                            fecha: true,
                        },
                    },
                },
            });

            return venta;
        });
    }

    async findAll(filters: {
        eventoId?: string;
        estado?: string;
        tipo?: string;
    }) {
        const where: Prisma.VentaWhereInput = {};
        if (filters.eventoId) where.evento_id = +filters.eventoId;
        if (filters.estado) where.estado = filters.estado;
        if (filters.tipo) where.tipo_venta = filters.tipo;

        return this.prisma.venta.findMany({
            where,
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                    },
                },
                evento: {
                    select: {
                        id: true,
                        nombre: true,
                        fecha: true,
                    },
                },
            },
            orderBy: { fecha: 'desc' },
        });
    }

    async findOne(id: string) {
        const venta = await this.prisma.venta.findUnique({
            where: { id: +id },
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                    },
                },
                evento: {
                    select: {
                        id: true,
                        nombre: true,
                        fecha: true,
                    },
                },
            },
        });

        if (!venta) {
            throw new NotFoundException('Venta no encontrada');
        }
        return venta;
    }

    async getCola(eventoId?: string) {
        const where: Prisma.VentaWhereInput = {
            estado: { in: ['pendiente', 'preparando'] },
            tipo_venta: 'BEBIDA',
        };
        if (eventoId) where.evento_id = +eventoId;

        return this.prisma.venta.findMany({
            where,
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                    },
                },
            },
            orderBy: { fecha: 'asc' }, // FIFO
        });
    }

    async getMisVentas(usuarioId: string) {
        return this.prisma.venta.findMany({
            where: { usuario_id: +usuarioId },
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                evento: {
                    select: {
                        id: true,
                        nombre: true,
                        fecha: true,
                    },
                },
            },
            orderBy: { fecha: 'desc' },
        });
    }

    async updateEstado(id: string, dto: UpdateEstadoDto) {
        const venta = await this.prisma.venta.findUnique({ where: { id: +id } });
        if (!venta) throw new NotFoundException('Venta no encontrada');

        // Validaciones de transición de estado
        if (venta.estado === 'cancelado') {
            throw new BadRequestException(
                'No se puede cambiar estado de una venta cancelada',
            );
        }
        if (venta.estado === 'entregado') {
            throw new BadRequestException('La venta ya fue entregada');
        }

        return this.prisma.venta.update({
            where: { id: +id },
            data: { 
                estado: dto.estado,
                ...(dto.estado === 'entregado' && { fecha_entrega: new Date() }),
            },
            include: {
                detalles: {
                    include: {
                        producto: true,
                    },
                },
                usuario: {
                    select: {
                        id: true,
                        nombre: true,
                        telefono: true,
                    },
                },
            },
        });
    }

    async cancelar(id: string, usuarioId: string, esAdmin: boolean) {
        const venta = await this.prisma.venta.findUnique({
            where: { id: +id },
            include: { detalles: true },
        });
        if (!venta) throw new NotFoundException('Venta no encontrada');

        // Solo el dueño o admin pueden cancelar
        if (!esAdmin && venta.usuario_id !== +usuarioId) {
            throw new ForbiddenException('No autorizado');
        }

        // Solo se puede cancelar si está PENDIENTE
        if (venta.estado !== 'pendiente') {
            throw new BadRequestException(
                'Solo se pueden cancelar ventas en estado PENDIENTE',
            );
        }

        // Devolver stock y marcar como cancelada
        return this.prisma.$transaction(async (tx) => {
            for (const detalle of venta.detalles) {
                if (detalle.producto_id) {
                    await tx.producto.update({
                        where: { id: detalle.producto_id },
                        data: { stock: { increment: detalle.cantidad } },
                    });
                }
            }

            return tx.venta.update({
                where: { id: +id },
                data: { estado: 'cancelado' },
                include: {
                    detalles: { include: { producto: true } },
                },
            });
        });
    }

    async reporteEvento(eventoId: string) {
        // Verificar evento existe
        const evento = await this.prisma.evento.findUnique({
            where: { id: +eventoId },
        });
        if (!evento) throw new NotFoundException('Evento no encontrado');

        // Ventas no canceladas
        const ventas = await this.prisma.venta.findMany({
            where: {
                evento_id: +eventoId,
                estado: { not: 'cancelado' },
            },
            include: {
                detalles: true,
            },
        });

        // Ingresos totales
        const ingresosTotales = ventas.reduce((sum, v) => sum + Number(v.total), 0);

        // Entradas vendidas (contar detalles sin producto_id)
        const entradasVendidas = ventas
            .flatMap((v) => v.detalles)
            .filter((d) => d.producto_id === null)
            .reduce((sum, d) => sum + d.cantidad, 0);

        // Bebidas vendidas
        const bebidasVendidas = ventas
            .flatMap((v) => v.detalles)
            .filter((d) => d.producto_id !== null)
            .reduce((sum, d) => sum + d.cantidad, 0);

        // Ingresos por tipo
        const ingresosEntradas = ventas
            .flatMap((v) => v.detalles)
            .filter((d) => d.producto_id === null)
            .reduce((sum, d) => sum + Number(d.subtotal), 0);

        const ingresosBebidas = ventas
            .flatMap((v) => v.detalles)
            .filter((d) => d.producto_id !== null)
            .reduce((sum, d) => sum + Number(d.subtotal), 0);

        // Top productos vendidos
        const productosMap = new Map<
            number,
            { nombre: string; cantidad: number; ingresos: number }
        >();
        for (const venta of ventas) {
            for (const detalle of venta.detalles) {
                if (detalle.producto_id) {
                    const key = detalle.producto_id;
                    const existing = productosMap.get(key);
                    if (existing) {
                        existing.cantidad += detalle.cantidad;
                        existing.ingresos += Number(detalle.subtotal);
                    } else {
                        productosMap.set(key, {
                            nombre: detalle.nombre_snapshot,
                            cantidad: detalle.cantidad,
                            ingresos: Number(detalle.subtotal),
                        });
                    }
                }
            }
        }
        const topProductos = Array.from(productosMap.values())
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10);

        // Ventas por hora (agrupar por hora del día)
        const ventasPorHoraMap = new Map<number, { cantidad: number; ingresos: number }>();
        for (const venta of ventas) {
            const hora = venta.fecha.getHours();
            const existing = ventasPorHoraMap.get(hora);
            if (existing) {
                existing.cantidad += 1;
                existing.ingresos += Number(venta.total);
            } else {
                ventasPorHoraMap.set(hora, { cantidad: 1, ingresos: Number(venta.total) });
            }
        }
        const ventasPorHora = Array.from(ventasPorHoraMap.entries())
            .map(([hora, data]) => ({ hora, ...data }))
            .sort((a, b) => a.hora - b.hora);

        // Estadísticas por estado
        const ventasPorEstado = {
            pendiente: 0,
            preparando: 0,
            listo: 0,
            entregado: 0,
        };
        for (const venta of ventas) {
            const estadoNormalizado = venta.estado.toLowerCase();
            if (estadoNormalizado in ventasPorEstado) {
                ventasPorEstado[estadoNormalizado as keyof typeof ventasPorEstado]++;
            }
        }

        return {
            evento: {
                id: evento.id,
                titulo: evento.nombre,
                fecha: evento.fecha,
            },
            resumen: {
                totalVentas: ventas.length,
                ingresosTotales,
                ingresosEntradas,
                ingresosBebidas,
                entradasVendidas,
                bebidasVendidas,
            },
            topProductos,
            ventasPorHora,
            ventasPorEstado,
        };
    }
}