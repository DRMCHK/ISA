FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies (including devDependencies needed for build)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package*.json ./
COPY --from=base /app/server.ts ./server.ts
COPY --from=base /app/lib ./lib
COPY --from=base /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
