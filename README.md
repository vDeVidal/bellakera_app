# 🎉 BELLAKERA

Aplicación para gestión de club nocturno: ventas de entradas, bebidas, galería de fotos, dinámicas y panel administrativo.

## 🛠️ Stack
- **Backend:** NestJS + Prisma + PostgreSQL
- **Panel Admin:** React + Vite
- **App Móvil:** React Native (Expo)
- **BD:** PostgreSQL 16
- **Contenedores:** Docker + Docker Compose

## 📋 Requisitos previos

1. **Docker Desktop** instalado y corriendo  
   👉 https://www.docker.com/products/docker-desktop/
2. **Git**  
   👉 https://git-scm.com/downloads
3. **Node.js 20+** (solo si vas a trabajar la app móvil)  
   👉 https://nodejs.org/
4. **VS Code** (recomendado)  
   👉 https://code.visualstudio.com/

## 🚀 Setup inicial (primera vez)

### 1. Clonar el repositorio
```bash
git clone https://github.com/vDeVidal/bellakera.git
cd bellakera
```

### 2. Crear el archivo `.env`
Copia el archivo de ejemplo:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### 3. Levantar los contenedores
```bash
docker compose up --build
```

⏰ La primera vez tarda 5-10 minutos (descarga imágenes).

Espera a ver:
```
bellakera_db        | database system is ready to accept connections
bellakera_backend   | 🚀 Backend en http://localhost:3000/api
bellakera_admin     | ➜  Local: http://localhost:5173/
```

### 4. Aplicar migraciones de la BD (en otra terminal)
```bash
docker exec -it bellakera_backend npx prisma migrate deploy
docker exec -it bellakera_backend npx prisma generate
docker exec -it bellakera_backend npx prisma db seed
```

## 🌐 URLs disponibles

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Backend API | http://localhost:3000/api/eventos | - |
| Panel Admin | http://localhost:5173 | - |
| pgAdmin | http://localhost:5050 | admin@bellakera.com / admin123 |
| PostgreSQL | localhost:5433 | bellakera_user / bellakera_pass_2025 |

## 🎛️ Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `docker compose up -d` | Levantar en background |
| `docker compose down` | Detener todo |
| `docker compose down -v` | Detener y borrar la BD |
| `docker compose logs -f backend` | Ver logs del backend |
| `docker compose restart backend` | Reiniciar un servicio |
| `docker ps` | Ver contenedores corriendo |

## 🔄 Flujo de trabajo diario

1. Abrir Docker Desktop.
2. En la raíz del proyecto: `docker compose up -d`
3. Editar código (los cambios se reflejan en vivo).
4. Al terminar: `docker compose down`

## 🗄️ Conectar DBeaver

- **Host:** `localhost`
- **Port:** `5433`
- **Database:** `bellakera_db`
- **User:** `bellakera_user`
- **Password:** `bellakera_pass_2025`

## 🆘 Problemas comunes

| Problema | Solución |
|----------|----------|
| Puerto ocupado | Cambia el puerto en `docker-compose.yml` |
| Backend no conecta a BD | `docker compose restart backend` |
| Cambios no se reflejan | `docker compose restart [servicio]` |
| Empezar desde cero | `docker compose down -v && docker compose up --build` |

## 📁 Estructura del proyecto

```
bellakera/
├── docker-compose.yml
├── .env (crear desde .env.example)
├── backend/             # NestJS API
│   ├── prisma/
│   └── src/
└── admin-panel/         # React + Vite
    └── src/
```