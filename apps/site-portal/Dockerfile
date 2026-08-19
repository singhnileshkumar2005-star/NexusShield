# ==============================================================================
# NexusSecure Site Owner Portal - Production Dockerfile
# ==============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json tsconfig.json ./
COPY apps/site-portal/package.json ./apps/site-portal/

RUN npm install

COPY apps/site-portal ./apps/site-portal

RUN npm --workspace=apps/site-portal run build

# Production Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3020

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/site-portal ./apps/site-portal

USER nextjs

EXPOSE 3020

CMD ["npm", "--workspace=apps/site-portal", "run", "start"]
