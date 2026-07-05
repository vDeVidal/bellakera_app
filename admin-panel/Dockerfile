FROM node:20-alpine

WORKDIR /app

# Copiar solo los archivos de dependencias primero (para cache)
COPY package*.json ./

# Instalar dependencias (incluidas devDependencies para tailwind, postcss, etc.)
RUN npm install --include=dev

# Copiar el resto del proyecto
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]