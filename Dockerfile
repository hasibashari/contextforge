# =====================================================================
# ContextForge: Fullstack Single-Container Production Image
# Multi-stage optimized for Google Cloud Run (Always Free Compliant)
# Total image size target: ~120-140 MB (< 500MB free quota)
# =====================================================================

# ---------------------------------------------------------------------
# Stage 1: Build Frontend (Vite / React SPA)
# ---------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------
# Stage 2: Build Backend (NestJS API Engine)
# ---------------------------------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build

# ---------------------------------------------------------------------
# Stage 3: Minimal Production Runtime
# ---------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install production dependencies only
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy database migrations & seeds
COPY backend/database ./database

# Copy compiled frontend assets into NestJS static public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose standard Cloud Run port
EXPOSE 8080

# Run NestJS production server
CMD ["node", "dist/main.js"]
