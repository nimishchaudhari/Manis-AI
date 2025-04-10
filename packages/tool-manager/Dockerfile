FROM node:18-slim AS base

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/tool-manager/package.json ./packages/tool-manager/package.json
COPY packages/shared-mcp/package.json ./packages/shared-mcp/package.json
COPY packages/shared-utils/package.json ./packages/shared-utils/package.json

RUN pnpm fetch

# Build project
FROM deps AS builder
COPY . .
RUN pnpm install --offline
RUN pnpm --filter "@acme/tool-manager" build

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Copy the production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/tool-manager/package.json ./packages/tool-manager/package.json
COPY --from=builder /app/packages/tool-manager/dist ./packages/tool-manager/dist
COPY --from=builder /app/packages/shared-mcp/dist ./packages/shared-mcp/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
USER appuser

# Start the server
CMD ["node", "packages/tool-manager/dist/index.js"]
