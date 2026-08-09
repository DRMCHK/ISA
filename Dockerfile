FROM node:20-bookworm-slim AS base

# Prisma needs OpenSSL both while generating its engine and at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (including devDeps needed for build)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci && npx prisma generate

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package*.json ./
COPY --from=base /app/server.ts ./server.ts
COPY --from=base /app/lib ./lib
COPY --from=base /app/next.config.mjs ./next.config.mjs

EXPOSE 3000

CMD ["npm", "run", "start:render"]
