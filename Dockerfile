
# ============================================
# MULTI-STAGE BUILD: Generación de variables + Build
# ============================================

FROM node:25-alpine AS builder

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Establecer ambiente como Docker
ENV NODE_ENV=docker

# Generar variables de entorno expandidas
# Las variables se leen automáticamente del archivo env_file pasado por docker-compose
RUN node scripts/generate-env.js

# Build con variables generadas
RUN npm run build

# ============================================
# STAGE 2: Servidor de producción
# ============================================

FROM node:25-alpine

WORKDIR /app

# Instalar serve para servir la aplicación
RUN npm install -g serve

# Copiar la carpeta dist del builder
COPY --from=builder /app/dist ./dist

# Exponer puerto
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/index.html || exit 1

# Comando para servir
CMD ["serve", "-s", "dist", "-l", "80"]