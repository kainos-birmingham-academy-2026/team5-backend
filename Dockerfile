# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app

# Prisma's native query engine requires OpenSSL at build time and runtime.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl \
	&& rm -rf /var/lib/apt/lists/*

# Install production dependencies. The toolchain supports bcrypt/argon2 when a
# compatible prebuilt binary is unavailable.
FROM base AS production-dependencies
ENV NODE_ENV=production
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Generate the Prisma client and compile TypeScript.
FROM base AS builder
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src ./src

# Client generation reads DATABASE_URL but does not connect to the database.
# Keep the TLS bypass local to this build step rather than the runtime image.
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 \
	PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 \
	DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
	npx prisma generate
RUN npm run build

# Final runtime image.
FROM base AS runtime
ENV NODE_ENV=production

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Winston creates log files when the application starts.
RUN mkdir -p /app/logs && chown node:node /app/logs

USER node
EXPOSE 3000
CMD ["npm", "start"]
