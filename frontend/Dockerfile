# Etapa 1: Build de la aplicación Vite
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar manifiesto de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Argumento para URL de API en build
ARG VITE_API_BASE=http://localhost:5175
ENV VITE_API_BASE=${VITE_API_BASE}

# Construir aplicación
RUN npm run build

# Etapa 2: Servidor estático con Nginx
FROM nginx:alpine

# Copiar build a directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración con soporte para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
