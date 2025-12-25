# Base stage
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
# Install dependencies without running scripts immediately
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Now that we have the code, run postinstall (prisma generate + tsr generate)
RUN pnpm run postinstall

# Ensure we build for production
# Ensure we build for production
ENV NODE_ENV=production
# We need to ensure build uses the correct keys or is build-safe
# Vinxi build generates .output/server/index.mjs by default without preset
RUN pnpm run build

# Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Copy necessary files
COPY --from=builder /app/.output ./.output
# Copy package.json if needed
COPY --from=builder /app/package.json ./package.json
# Copy node_modules (required for externalized dependencies & Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start the server
# Enable experimental-specifier-resolution to handle strict ESM imports from external packages
CMD ["node", "--experimental-specifier-resolution=node", ".output/server/index.mjs"]
