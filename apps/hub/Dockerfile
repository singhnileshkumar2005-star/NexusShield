# ==============================================================================
# NexusSecure Hub Coordinator - Production Dockerfile
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and package manifests
COPY package.json tsconfig.json ./
COPY apps/hub/package.json ./apps/hub/
COPY packages/agent/package.json ./packages/agent/

# Install dependencies
RUN npm install

# Copy source files
COPY packages/agent ./packages/agent
COPY apps/hub ./apps/hub

# Build packages
RUN npm --workspace=packages/agent run build
RUN npm --workspace=apps/hub run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Create app directory & non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nexususer

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/agent/dist ./packages/agent/dist
COPY --from=builder /app/packages/agent/package.json ./packages/agent/package.json
COPY --from=builder /app/apps/hub/dist ./apps/hub/dist
COPY --from=builder /app/apps/hub/package.json ./apps/hub/package.json

# Create data directory for local store
RUN mkdir -p /app/apps/hub/data && chown -R nexususer:nodejs /app

USER nexususer

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "apps/hub/dist/server.js"]
