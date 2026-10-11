# ==============================================================================
# CONNECTX - Production Dockerfile (Multi-stage build)
# ==============================================================================

# Stage 1: Build the client and server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies (including devDependencies required for build)
RUN npm ci

# Copy full application source
COPY . .

# Generate Prisma client and build both workspaces (server + client)
RUN npm run build

# Stage 2: Production runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma engine on Alpine
RUN apk add --no-cache openssl

# Copy package manifests and install production dependencies
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --omit=dev

# Copy compiled server code and Prisma schema/client
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/server/node_modules/.prisma ./server/node_modules/.prisma
COPY --from=builder /app/server/node_modules/@prisma ./server/node_modules/@prisma

# Copy built frontend static bundle (served by Express in production)
COPY --from=builder /app/client/dist ./client/dist

# Create uploads directory
RUN mkdir -p uploads

# Expose production port
EXPOSE 5000

# Start server
CMD ["node", "server/dist/server.js"]
