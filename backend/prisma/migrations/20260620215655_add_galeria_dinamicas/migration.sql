-- CreateTable
CREATE TABLE "galeria" (
    "id_media" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_evento" INTEGER,
    "tipo" VARCHAR(10) NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "descripcion" TEXT,
    "fecha_subida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_moderacion" VARCHAR(20) NOT NULL DEFAULT 'aprobado',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "likes_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "galeria_pkey" PRIMARY KEY ("id_media")
);

-- CreateTable
CREATE TABLE "likes_galeria" (
    "id_like" SERIAL NOT NULL,
    "id_media" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_galeria_pkey" PRIMARY KEY ("id_like")
);

-- CreateTable
CREATE TABLE "dinamicas" (
    "id_dinamica" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "descripcion" TEXT,
    "tipo" VARCHAR(50),
    "reglas" TEXT,
    "imagen_url" TEXT,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'programada',
    "premio" TEXT,

    CONSTRAINT "dinamicas_pkey" PRIMARY KEY ("id_dinamica")
);

-- CreateTable
CREATE TABLE "participaciones" (
    "id_participacion" SERIAL NOT NULL,
    "id_dinamica" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL DEFAULT 0,
    "fecha_participacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participaciones_pkey" PRIMARY KEY ("id_participacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "likes_galeria_id_media_id_usuario_key" ON "likes_galeria"("id_media", "id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "participaciones_id_dinamica_id_usuario_key" ON "participaciones"("id_dinamica", "id_usuario");

-- AddForeignKey
ALTER TABLE "galeria" ADD CONSTRAINT "galeria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "galeria" ADD CONSTRAINT "galeria_id_evento_fkey" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_evento") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_galeria" ADD CONSTRAINT "likes_galeria_id_media_fkey" FOREIGN KEY ("id_media") REFERENCES "galeria"("id_media") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_galeria" ADD CONSTRAINT "likes_galeria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participaciones" ADD CONSTRAINT "participaciones_id_dinamica_fkey" FOREIGN KEY ("id_dinamica") REFERENCES "dinamicas"("id_dinamica") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participaciones" ADD CONSTRAINT "participaciones_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
