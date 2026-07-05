import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ============================================================
  // 1. ADMINISTRADORES
  // ============================================================
  const pinAdminHash = await bcrypt.hash('1234', 10);

  const adminPrincipal = await prisma.administrador.upsert({
    where: { telefono: '999999999' },
    update: {},
    create: {
      telefono: '999999999',
      nombre: 'Admin Principal',
      pin_hash: pinAdminHash,
      rol: 'SUPER_ADMIN',
      activo: true,
    },
  });

  const adminBar = await prisma.administrador.upsert({
    where: { telefono: '888888888' },
    update: {},
    create: {
      telefono: '888888888',
      nombre: 'Admin Bar',
      pin_hash: pinAdminHash,
      rol: 'BAR',
      activo: true,
    },
  });

  console.log('✅ Administradores creados');

  // ============================================================
  // 2. USUARIOS
  // ============================================================
  const pinUsuarioHash = await bcrypt.hash('0000', 10);

  const usuario1 = await prisma.usuario.upsert({
    where: { telefono: '600000001' },
    update: {},
    create: {
      telefono: '600000001',
      nombre: 'Juan Pérez',
      pin_hash: pinUsuarioHash,
      verificado: true,
    },
  });

  const usuario2 = await prisma.usuario.upsert({
    where: { telefono: '600000002' },
    update: {},
    create: {
      telefono: '600000002',
      nombre: 'María García',
      pin_hash: pinUsuarioHash,
      verificado: true,
    },
  });

  const usuario3 = await prisma.usuario.upsert({
    where: { telefono: '600000003' },
    update: {},
    create: {
      telefono: '600000003',
      nombre: 'Carlos López',
      pin_hash: pinUsuarioHash,
      verificado: true,
    },
  });

  console.log('✅ Usuarios creados');

  // ============================================================
  // 3. EVENTOS
  // ============================================================
  const evento1 = await prisma.evento.create({
    data: {
      nombre: 'Bellakera Night - Reggaeton Party',
      descripcion: 'La mejor noche de reggaeton con los mejores DJs de la ciudad.',
      fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 días
      precio: 15.0,
      imagen_url: null,
      estado: 'activo',
      aforo_maximo: 300,
      fecha_cierre: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    },
  });

  const evento2 = await prisma.evento.create({
    data: {
      nombre: 'Latin Vibes',
      descripcion: 'Ritmos latinos toda la noche.',
      fecha: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      precio: 20.0,
      imagen_url: null,
      estado: 'activo',
      aforo_maximo: 250,
      fecha_cierre: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Eventos creados');

  // ============================================================
  // 4. PRODUCTOS
  // ============================================================
  const cerveza = await prisma.producto.create({
    data: {
      nombre: 'Cerveza',
      descripcion: 'Cerveza nacional 33cl',
      precio: 4.0,
      stock: 200,
      disponible: true,
    },
  });

  const cubata = await prisma.producto.create({
    data: {
      nombre: 'Cubata',
      descripcion: 'Combinado premium',
      precio: 8.0,
      stock: 150,
      disponible: true,
    },
  });

  const chupito = await prisma.producto.create({
    data: {
      nombre: 'Chupito',
      descripcion: 'Chupito variado',
      precio: 3.0,
      stock: 300,
      disponible: true,
    },
  });

  const aguaMineral = await prisma.producto.create({
    data: {
      nombre: 'Agua Mineral',
      descripcion: 'Agua mineral 50cl',
      precio: 2.0,
      stock: 100,
      disponible: true,
    },
  });

  console.log('✅ Productos creados');

  // ============================================================
  // 5. VENTAS DE ENTRADAS (con QR)
  // ============================================================
  await prisma.venta.create({
    data: {
      tipo_venta: 'ENTRADA',
      estado: 'pagado',
      total: 15.0,
      metodo_pago: 'tarjeta',
      qr_code: randomUUID(),
      qr_escaneado: false,
      usuario: { connect: { id: usuario1.id } },
      evento: { connect: { id: evento1.id } },
      detalles: {
        create: [
          {
            nombre_snapshot: 'Entrada Bellakera Night',
            cantidad: 1,
            precio_unitario: 15.0,
            subtotal: 15.0,
            estado: 'entregado',
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      tipo_venta: 'ENTRADA',
      estado: 'pagado',
      total: 30.0,
      metodo_pago: 'tarjeta',
      qr_code: randomUUID(),
      qr_escaneado: true,
      usuario: { connect: { id: usuario2.id } },
      evento: { connect: { id: evento1.id } },
      admin: { connect: { id: adminPrincipal.id } },
      detalles: {
        create: [
          {
            nombre_snapshot: 'Entrada Bellakera Night',
            cantidad: 2,
            precio_unitario: 15.0,
            subtotal: 30.0,
            estado: 'entregado',
          },
        ],
      },
    },
  });

  console.log('✅ Ventas de entradas creadas');

  // ============================================================
  // 6. VENTAS DE BEBIDAS (cola de bar)
  // ============================================================
  await prisma.venta.create({
    data: {
      tipo_venta: 'BEBIDA',
      estado: 'preparando',
      total: 12.0,
      metodo_pago: 'app',
      usuario: { connect: { id: usuario1.id } },
      evento: { connect: { id: evento1.id } },
      detalles: {
        create: [
          {
            nombre_snapshot: 'Cerveza',
            cantidad: 2,
            precio_unitario: 4.0,
            subtotal: 8.0,
            estado: 'pendiente',
            producto: { connect: { id: cerveza.id } },
          },
          {
            nombre_snapshot: 'Agua Mineral',
            cantidad: 2,
            precio_unitario: 2.0,
            subtotal: 4.0,
            estado: 'pendiente',
            producto: { connect: { id: aguaMineral.id } },
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      tipo_venta: 'BEBIDA',
      estado: 'listo',
      total: 8.0,
      metodo_pago: 'app',
      usuario: { connect: { id: usuario2.id } },
      evento: { connect: { id: evento1.id } },
      admin: { connect: { id: adminBar.id } },
      detalles: {
        create: [
          {
            nombre_snapshot: 'Cubata',
            cantidad: 1,
            precio_unitario: 8.0,
            subtotal: 8.0,
            estado: 'listo',
            producto: { connect: { id: cubata.id } },
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      tipo_venta: 'BEBIDA',
      estado: 'entregado',
      total: 6.0,
      metodo_pago: 'app',
      fecha_entrega: new Date(),
      usuario: { connect: { id: usuario3.id } },
      evento: { connect: { id: evento1.id } },
      admin: { connect: { id: adminBar.id } },
      detalles: {
        create: [
          {
            nombre_snapshot: 'Chupito',
            cantidad: 2,
            precio_unitario: 3.0,
            subtotal: 6.0,
            estado: 'entregado',
            producto: { connect: { id: chupito.id } },
          },
        ],
      },
    },
  });

  console.log('✅ Ventas de bebidas creadas');

  console.log('🎉 Seed completado con éxito');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });