-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "codigo_expira" TIMESTAMP(3),
ADD COLUMN     "codigo_verificacion" VARCHAR(10),
ADD COLUMN     "fecha_nacimiento" DATE,
ADD COLUMN     "puntos_acumulados" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ultimo_acceso" TIMESTAMP(3),
ADD COLUMN     "verificado" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "nombre" DROP NOT NULL,
ALTER COLUMN "apellido" DROP NOT NULL,
ALTER COLUMN "estado" SET DEFAULT 'pendiente';

-- CreateTable
CREATE TABLE "redes_sociales" (
    "id_red" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "plataforma" VARCHAR(50) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "url" TEXT,

    CONSTRAINT "redes_sociales_pkey" PRIMARY KEY ("id_red")
);

-- AddForeignKey
ALTER TABLE "redes_sociales" ADD CONSTRAINT "redes_sociales_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;
