import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de BELLAKERA...\n');

  // ============================================
  // 1. LIMPIAR DATOS EXISTENTES (orden importante por FK)
  // ============================================
  console.log('🧹 Limpiando base de datos...');
  await prisma.participacion.deleteMany();
  await prisma.dinamica.deleteMany();
  await prisma.likeGaleria.deleteMany();
  await prisma.galeria.deleteMany();
  await prisma.venta.deleteMany();
  await prisma.producto.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.redSocial.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.administrador.deleteMany();
  console.log('✅ Base de datos limpia\n');

  // ============================================
  // 2. ADMINISTRADORES
  // ============================================
  console.log('👨‍💼 Creando administradores...');
  const pinAdminHash = await bcrypt.hash('1234', 10);

  const adminSuper = await prisma.administrador.create({
    data: {
      telefono: '+56900000001',
      pin_hash: pinAdminHash,
      nombre: 'Super',
      apellido: 'Admin',
      rol: 'SUPER_ADMIN',
      activo: true,
    },
  });

  const adminCaja = await prisma.administrador.create({
    data: {
      telefono: '+56900000002',
      pin_hash: pinAdminHash,
      nombre: 'María',
      apellido: 'Cajera',
      rol: 'CAJA',
      activo: true,
    },
  });

  const adminPuerta = await prisma.administrador.create({
    data: {
      telefono: '+56900000003',
      pin_hash: pinAdminHash,
      nombre: 'Carlos',
      apellido: 'Puerta',
      rol: 'PUERTA',
      activo: true,
    },
  });

  console.log(`✅ ${3} administradores creados\n`);

  // ============================================
  // 3. USUARIOS
  // ============================================
  console.log('👥 Creando usuarios...');
  const pinUsuarioHash = await bcrypt.hash('0000', 10);

  const usuario1 = await prisma.usuario.create({
    data: {
      telefono: '+56911111111',
      pin_hash: pinUsuarioHash,
      nombre: 'Javiera',
      apellido: 'González',
      fecha_nacimiento: new Date('2000-05-15'),
      estado: 'ACTIVO',
      verificado: true,
      puntos_acumulados: 150,
      redes_sociales: {
        create: [
          { plataforma: 'INSTAGRAM', username: 'javi_glez', url: 'https://instagram.com/javi_glez' },
          { plataforma: 'TIKTOK', username: '@javiglez', url: 'https://tiktok.com/@javiglez' },
        ],
      },
    },
  });

  const usuario2 = await prisma.usuario.create({
    data: {
      telefono: '+56922222222',
      pin_hash: pinUsuarioHash,
      nombre: 'Diego',
      apellido: 'Muñoz',
      fecha_nacimiento: new Date('1998-08-22'),
      estado: 'ACTIVO',
      verificado: true,
      puntos_acumulados: 80,
      redes_sociales: {
        create: [
          { plataforma: 'INSTAGRAM', username: 'diegomuz', url: 'https://instagram.com/diegomuz' },
        ],
      },
    },
  });

  const usuario3 = await prisma.usuario.create({
    data: {
      telefono: '+56933333333',
      pin_hash: pinUsuarioHash,
      nombre: 'Camila',
      apellido: 'Rojas',
      fecha_nacimiento: new Date('2001-11-03'),
      estado: 'ACTIVO',
      verificado: true,
      puntos_acumulados: 320,
    },
  });

  const usuario4 = await prisma.usuario.create({
    data: {
      telefono: '+56944444444',
      pin_hash: pinUsuarioHash,
      nombre: 'Sebastián',
      apellido: 'Pérez',
      estado: 'ACTIVO',
      verificado: false,
      codigo_verificacion: '4321',
      codigo_expira: new Date(Date.now() + 10 * 60 * 1000),
      puntos_acumulados: 0,
    },
  });

  console.log(`✅ 4 usuarios creados\n`);

  // ============================================
  // 4. EVENTOS
  // ============================================
  console.log('🎉 Creando eventos...');

  const evento1 = await prisma.evento.create({
    data: {
      nombre: 'BELLAKERA NIGHT - Reggaeton Edition',
      descripcion: 'La noche más bellaka del año. DJs invitados, premios y sorpresas.',
      flyer_url: 'https://placehold.co/600x800/ff006e/ffffff?text=BELLAKERA+NIGHT',
      fecha_evento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // en 7 días
      estado: 'ACTIVO',
      id_admin_creador: adminSuper.id_admin,
    },
  });

  const evento2 = await prisma.evento.create({
    data: {
      nombre: 'Halloween Bellako',
      descripcion: 'Ven disfrazado y participa por premios. Música electrónica toda la noche.',
      flyer_url: 'https://placehold.co/600x800/8338ec/ffffff?text=HALLOWEEN',
      fecha_evento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // en 30 días
      estado: 'ACTIVO',
      id_admin_creador: adminSuper.id_admin,
    },
  });

  const evento3 = await prisma.evento.create({
    data: {
      nombre: 'Fiesta Aniversario',
      descripcion: 'Celebramos un año más con música, premios y mucho perreo.',
      flyer_url: 'https://placehold.co/600x800/3a86ff/ffffff?text=ANIVERSARIO',
      fecha_evento: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // hace 30 días (pasado)
      estado: 'FINALIZADO',
      id_admin_creador: adminSuper.id_admin,
    },
  });

  console.log(`✅ 3 eventos creados\n`);

  // ============================================
  // 5. PRODUCTOS (bebidas, snacks)
  // ============================================
  console.log('🍻 Creando productos...');

  const productos = await Promise.all([
    prisma.producto.create({
      data: { nombre: 'Cerveza Heineken', precio: 4500, stock_actual: 200, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Cerveza Corona', precio: 5000, stock_actual: 150, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Piscola individual', precio: 6000, stock_actual: 300, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Jarra de Piscola', precio: 18000, stock_actual: 80, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Vodka tonic', precio: 7000, stock_actual: 100, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Tequila shot', precio: 5500, stock_actual: 120, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Red Bull', precio: 4000, stock_actual: 200, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Agua mineral', precio: 2000, stock_actual: 250, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Papas fritas', precio: 3500, stock_actual: 100, disponible: true },
    }),
    prisma.producto.create({
      data: { nombre: 'Botella Premium Vodka', precio: 80000, stock_actual: 20, disponible: true },
    }),
  ]);

  console.log(`✅ ${productos.length} productos creados\n`);

  // ============================================
  // 6. VENTAS (algunas de ejemplo)
  // ============================================
  console.log('💰 Creando ventas de ejemplo...');

  await prisma.venta.create({
    data: {
      id_usuario: usuario1.id_usuario,
      tipo_venta: 'ENTRADA',
      total: 15000,
      estado_pago: 'PAGADO',
      id_evento: evento1.id_evento,
    },
  });

  await prisma.venta.create({
    data: {
      id_usuario: usuario2.id_usuario,
      tipo_venta: 'ENTRADA',
      total: 15000,
      estado_pago: 'PAGADO',
      id_evento: evento1.id_evento,
    },
  });

  await prisma.venta.create({
    data: {
      id_usuario: usuario3.id_usuario,
      tipo_venta: 'BEBIDA',
      total: 11500,
      estado_pago: 'PAGADO',
      id_evento: evento1.id_evento,
    },
  });

  await prisma.venta.create({
    data: {
      id_usuario: usuario1.id_usuario,
      tipo_venta: 'BEBIDA',
      total: 18000,
      estado_pago: 'PENDIENTE',
    },
  });

  console.log(`✅ 4 ventas creadas\n`);

  // ============================================
  // 7. GALERÍA (fotos/videos)
  // ============================================
  console.log('📸 Creando galería...');

  const media1 = await prisma.galeria.create({
    data: {
      id_usuario: usuario1.id_usuario,
      id_evento: evento3.id_evento,
      tipo: 'FOTO',
      url: 'https://placehold.co/800x800/ff006e/ffffff?text=Foto+1',
      thumbnail_url: 'https://placehold.co/200x200/ff006e/ffffff?text=Foto+1',
      descripcion: 'La mejor noche bellaka 🔥',
      estado_moderacion: 'APROBADO',
      visible: true,
      likes_count: 2,
    },
  });

  const media2 = await prisma.galeria.create({
    data: {
      id_usuario: usuario2.id_usuario,
      id_evento: evento3.id_evento,
      tipo: 'FOTO',
      url: 'https://placehold.co/800x800/8338ec/ffffff?text=Foto+2',
      thumbnail_url: 'https://placehold.co/200x200/8338ec/ffffff?text=Foto+2',
      descripcion: 'Equipo completo 💃🕺',
      estado_moderacion: 'APROBADO',
      visible: true,
      likes_count: 1,
    },
  });

  const media3 = await prisma.galeria.create({
    data: {
      id_usuario: usuario3.id_usuario,
      tipo: 'VIDEO',
      url: 'https://placehold.co/800x800/3a86ff/ffffff?text=Video',
      thumbnail_url: 'https://placehold.co/200x200/3a86ff/ffffff?text=Video',
      descripcion: 'Mira este perreo intenso 🎶',
      estado_moderacion: 'PENDIENTE',
      visible: false,
      likes_count: 0,
    },
  });

  console.log(`✅ 3 publicaciones en galería\n`);

  // ============================================
  // 8. LIKES en galería
  // ============================================
  console.log('❤️ Creando likes...');

  await prisma.likeGaleria.create({
    data: { id_media: media1.id_media, id_usuario: usuario2.id_usuario },
  });
  await prisma.likeGaleria.create({
    data: { id_media: media1.id_media, id_usuario: usuario3.id_usuario },
  });
  await prisma.likeGaleria.create({
    data: { id_media: media2.id_media, id_usuario: usuario1.id_usuario },
  });

  console.log(`✅ 3 likes creados\n`);

  // ============================================
  // 9. DINÁMICAS / JUEGOS
  // ============================================
  console.log('🎮 Creando dinámicas...');

  const dinamica1 = await prisma.dinamica.create({
    data: {
      nombre: 'El Más Bellako de la Noche',
      descripcion: 'Vota por quien tenga el mejor outfit bellako.',
      tipo: 'VOTACION',
      reglas: 'Cada usuario puede votar 1 vez. Gana el más votado.',
      imagen_url: 'https://placehold.co/600x400/ff006e/ffffff?text=Mas+Bellako',
      fecha_inicio: new Date(),
      fecha_fin: new Date(Date.now() + 24 * 60 * 60 * 1000),
      estado: 'ACTIVO',
      premio: '1 botella de Vodka Premium',
    },
  });

  const dinamica2 = await prisma.dinamica.create({
    data: {
      nombre: 'Reto del Baile',
      descripcion: 'Sube un video bailando el tema que está sonando.',
      tipo: 'RETO',
      reglas: 'Sube tu video desde la app. Los más likes ganan.',
      imagen_url: 'https://placehold.co/600x400/8338ec/ffffff?text=Reto+Baile',
      fecha_inicio: new Date(),
      fecha_fin: new Date(Date.now() + 3 * 60 * 60 * 1000),
      estado: 'ACTIVO',
      premio: '2 entradas para el próximo evento',
    },
  });

  const dinamica3 = await prisma.dinamica.create({
    data: {
      nombre: 'Trivia Reggaetonera',
      descripcion: 'Responde preguntas sobre reggaeton y gana puntos.',
      tipo: 'TRIVIA',
      reglas: '10 preguntas. Gana quien más acierte en menor tiempo.',
      imagen_url: 'https://placehold.co/600x400/3a86ff/ffffff?text=Trivia',
      fecha_inicio: new Date(Date.now() + 60 * 60 * 1000),
      estado: 'PROGRAMADA',
      premio: '50.000 CLP en consumo',
    },
  });

  console.log(`✅ 3 dinámicas creadas\n`);

  // ============================================
  // 10. PARTICIPACIONES en dinámicas
  // ============================================
  console.log('🏆 Creando participaciones...');

  await prisma.participacion.create({
    data: { id_dinamica: dinamica1.id_dinamica, id_usuario: usuario1.id_usuario, puntaje: 50 },
  });
  await prisma.participacion.create({
    data: { id_dinamica: dinamica1.id_dinamica, id_usuario: usuario2.id_usuario, puntaje: 30 },
  });
  await prisma.participacion.create({
    data: { id_dinamica: dinamica1.id_dinamica, id_usuario: usuario3.id_usuario, puntaje: 80 },
  });
  await prisma.participacion.create({
    data: { id_dinamica: dinamica2.id_dinamica, id_usuario: usuario1.id_usuario, puntaje: 100 },
  });
  await prisma.participacion.create({
    data: { id_dinamica: dinamica2.id_dinamica, id_usuario: usuario3.id_usuario, puntaje: 75 },
  });

  console.log(`✅ 5 participaciones creadas\n`);

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('═══════════════════════════════════════');
  console.log('🎉 SEED COMPLETADO CON ÉXITO 🎉');
  console.log('═══════════════════════════════════════');
  console.log('\n📋 CREDENCIALES DE PRUEBA:\n');
  console.log('👨‍💼 ADMINISTRADORES (PIN: 1234)');
  console.log('   • SUPER ADMIN  → +56900000001');
  console.log('   • CAJA         → +56900000002');
  console.log('   • PUERTA       → +56900000003');
  console.log('\n👥 USUARIOS (PIN: 0000)');
  console.log('   • Javiera     → +56911111111  (verificado)');
  console.log('   • Diego       → +56922222222  (verificado)');
  console.log('   • Camila      → +56933333333  (verificado)');
  console.log('   • Sebastián   → +56944444444  (NO verificado, código: 4321)');
  console.log('\n═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });