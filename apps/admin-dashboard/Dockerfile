# ==============================================================================
# NexusSecure Admin Dashboard - Production Dockerfile
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/

RUN npm install

COPY apps/admin-dashboard ./apps/admin-dashboard

RUN npm --workspace=apps/admin-dashboard run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3010

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/admin-dashboard ./apps/admin-dashboard

USER nextjs

EXPOSE 3010

CMD ["npm", "--workspace=apps/admin-dashboard", "run", "start"]
