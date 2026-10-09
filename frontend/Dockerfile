# Frontend Dockerfile para Render
FROM node:18-alpine as builder

WORKDIR /app

# Copiar package.json
COPY frontend/package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY frontend/ ./

# Build para producción
ENV VITE_API_BASE=https://memorize-backend.onrender.com
RUN npm run build

# Servir archivos estáticos
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
