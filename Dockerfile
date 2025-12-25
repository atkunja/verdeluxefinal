# Base stage
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
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
# Copy package.json if needed for scripts, though we usually run node directly
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Start the server
# Vinxi's default output is a standout server at .output/server/index.mjs
CMD ["node", ".output/server/index.mjs"]
