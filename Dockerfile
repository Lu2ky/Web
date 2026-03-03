
# ============================================
# STAGE 1: Build estático (sin variables de entorno)
# ============================================
# Las variables VITE_* NO se necesitan aquí.
# Se inyectan en RUNTIME mediante docker-entrypoint.sh

FROM node:25-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build sin variables – el código usa env() helper que lee window.__ENV__
RUN npm run build:ci

# ============================================
# STAGE 2: Servidor de producción ligero
# ============================================

FROM node:25-alpine

WORKDIR /app

RUN npm install -g serve

# Copiar solo el build estático
COPY --from=builder /app/dist ./dist

# Copiar el entrypoint que genera env-config.js en runtime
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "80"]