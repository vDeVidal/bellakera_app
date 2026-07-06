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
    where: { telefono: '+56999999999' },
    update: {},
    create: {
      telefono: '+56999999999',
      nombre: 'Admin Principal',
      pin_hash: pinAdminHash,
      rol: 'SUPER_ADMIN',
      activo: true,
    },
  });

  const adminBar = await prisma.administrador.upsert({
    where: { telefono: '+56988888888' },
    update: {},
    create: {
      telefono: '+56988888888',
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
    where: { telefono: '+56960000001' },
    update: {},
    create: {
      telefono: '+56960000001',
      nombre: 'Juan Pérez',
      pin_hash: pinUsuarioHash,
      verificado: true,
    },
  });

  const usuario2 = await prisma.usuario.upsert({
    where: { telefono: '+56960000002' },
    update: {},
    create: {
      telefono: '+56960000002',
      nombre: 'María García',
      pin_hash: pinUsuarioHash,
      verificado: true,
    },
  });

  const usuario3 = await prisma.usuario.upsert({
    where: { telefono: '+56960000003' },
    update: {},
    create: {
      telefono: '+56960000003',
      nombre: 'Carlos López',
      pin_hash: pinUsuarioHash,
      verificado: true,
    },
  });

  console.log('✅ Usuarios creados');

  // ============================================================
  // 3. EVENTOS  (precio como Int puro - CLP)
  // ============================================================
  const evento1 = await prisma.evento.create({
    data: {
      nombre: 'Bellakera Night - Reggaeton Party',
      descripcion: 'La mejor noche de reggaeton con los mejores DJs de la ciudad.',
      fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      precio: 15000,           // ← INT puro (CLP)
      imagen_url: null,
      estado: 'ACTIVO',        // ← mayúsculas consistentes
      aforo_maximo: 300,
      fecha_cierre: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    },
  });

  const evento2 = await prisma.evento.create({
    data: {
      nombre: 'Latin Vibes',
      descripcion: 'Ritmos latinos toda la noche.',
      fecha: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      precio: 20000,
      imagen_url: null,
      estado: 'ACTIVO',
      aforo_maximo: 250,
      fecha_cierre: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Eventos creados');

  // ============================================================
  // 4. PRODUCTOS  (precio como Int puro - CLP)
  // ============================================================
  const cerveza = await prisma.producto.create({
    data: {
      nombre: 'Cerveza',
      descripcion: 'Cerveza nacional 33cl',
      precio: 3000,
      stock: 200,
      disponible: true,
    },
  });

  const cubata = await prisma.producto.create({
    data: {
      nombre: 'Cubata',
      descripcion: 'Combinado premium',
      precio: 6000,
      stock: 150,
      disponible: true,
    },
  });

  const chupito = await prisma.producto.create({
    data: {
      nombre: 'Chupito',
      descripcion: 'Chupito variado',
      precio: 2500,
      stock: 300,
      disponible: true,
    },
  });

  const aguaMineral = await prisma.producto.create({
    data: {
      nombre: 'Agua Mineral',
      descripcion: 'Agua mineral 50cl',
      precio: 1500,
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
      estado: 'PAGADO',
      total: 15000,
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
            precio_unitario: 15000,
            subtotal: 15000,
            estado: 'ENTREGADO',
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      tipo_venta: 'ENTRADA',
      estado: 'PAGADO',
      total: 30000,
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
            precio_unitario: 15000,
            subtotal: 30000,
            estado: 'ENTREGADO',
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
      estado: 'PREPARANDO',
      total: 9000,
      metodo_pago: 'app',
      usuario: { connect: { id: usuario1.id } },
      evento: { connect: { id: evento1.id } },
      detalles: {
        create: [
          {
            nombre_snapshot: 'Cerveza',
            cantidad: 2,
            precio_unitario: 3000,
            subtotal: 6000,
            estado: 'PENDIENTE',
            producto: { connect: { id: cerveza.id } },
          },
          {
            nombre_snapshot: 'Agua Mineral',
            cantidad: 2,
            precio_unitario: 1500,
            subtotal: 3000,
            estado: 'PENDIENTE',
            producto: { connect: { id: aguaMineral.id } },
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      tipo_venta: 'BEBIDA',
      estado: 'LISTO',
      total: 6000,
      metodo_pago: 'app',
      usuario: { connect: { id: usuario2.id } },
      evento: { connect: { id: evento1.id } },
      admin: { connect: { id: adminBar.id } },
      detalles: {
        create: [
          {
            nombre_snapshot: 'Cubata',
            cantidad: 1,
            precio_unitario: 6000,
            subtotal: 6000,
            estado: 'LISTO',
            producto: { connect: { id: cubata.id } },
          },
        ],
      },
    },
  });

  await prisma.venta.create({
    data: {
      tipo_venta: 'BEBIDA',
      estado: 'ENTREGADO',
      total: 5000,
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
            precio_unitario: 2500,
            subtotal: 5000,
            estado: 'ENTREGADO',
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