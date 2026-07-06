-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "codigo_sms" TEXT,
    "codigo_expira" TIMESTAMP(3),
    "avatar_url" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_conexion" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "red_social" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "bio" TEXT,
    "intereses" TEXT,
    "instagram" TEXT,
    "fecha_update" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "red_social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "administradores" (
    "id" SERIAL NOT NULL,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "administradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "imagen_url" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "aforo_maximo" INTEGER,
    "fecha_cierre" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "imagen_url" TEXT,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "tipo_venta" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "metodo_pago" TEXT,
    "notas" TEXT,
    "qr_code" TEXT,
    "qr_escaneado" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" TIMESTAMP(3),

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetalleVenta" (
    "id" SERIAL NOT NULL,
    "venta_id" INTEGER NOT NULL,
    "producto_id" INTEGER,
    "nombre_snapshot" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,

    CONSTRAINT "DetalleVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "galerias" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "evento_id" INTEGER,
    "imagen_url" TEXT NOT NULL,
    "descripcion" TEXT,
    "aprobado" BOOLEAN NOT NULL DEFAULT true,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "galerias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes_galeria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "galeria_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_galeria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dinamicas" (
    "id" SERIAL NOT NULL,
    "evento_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "configuracion" JSONB,

    CONSTRAINT "dinamicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participaciones" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "dinamica_id" INTEGER NOT NULL,
    "respuesta" JSONB,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefono_key" ON "usuarios"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "red_social_usuario_id_key" ON "red_social"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "administradores_telefono_key" ON "administradores"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Venta_qr_code_key" ON "Venta"("qr_code");

-- CreateIndex
CREATE INDEX "Venta_evento_id_idx" ON "Venta"("evento_id");

-- CreateIndex
CREATE INDEX "Venta_usuario_id_idx" ON "Venta"("usuario_id");

-- CreateIndex
CREATE INDEX "Venta_estado_idx" ON "Venta"("estado");

-- CreateIndex
CREATE INDEX "DetalleVenta_venta_id_idx" ON "DetalleVenta"("venta_id");

-- CreateIndex
CREATE INDEX "DetalleVenta_producto_id_idx" ON "DetalleVenta"("producto_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_galeria_usuario_id_galeria_id_key" ON "likes_galeria"("usuario_id", "galeria_id");

-- AddForeignKey
ALTER TABLE "red_social" ADD CONSTRAINT "red_social_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "administradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetalleVenta" ADD CONSTRAINT "DetalleVenta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galerias" ADD CONSTRAINT "galerias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galerias" ADD CONSTRAINT "galerias_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_galeria" ADD CONSTRAINT "likes_galeria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_galeria" ADD CONSTRAINT "likes_galeria_galeria_id_fkey" FOREIGN KEY ("galeria_id") REFERENCES "galerias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dinamicas" ADD CONSTRAINT "dinamicas_evento_id_fkey" FOREIGN KEY ("evento_id") REFERENCES "eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participaciones" ADD CONSTRAINT "participaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participaciones" ADD CONSTRAINT "participaciones_dinamica_id_fkey" FOREIGN KEY ("dinamica_id") REFERENCES "dinamicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
