FROM node:20-alpine

WORKDIR /app

# Instalar dependencias necesarias para compilación nativa si fuera necesario
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar el resto del código fuente del backend
COPY tsconfig.json ./
COPY src ./src/
COPY scripts ./scripts/

# Compilar TypeScript a JavaScript (dist/)
RUN npm run build

# Exponer el puerto configurado (5175)
EXPOSE 5175

# Al iniciar: sincronizar esquema en PostgreSQL y arrancar el servidor
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]

