# Multi-stage build for anyWarehouse_front (SvelteKit + Vite) using Bun
# Builder: install deps (including dev deps), build the app
# Runner: copy only build output + production deps and run the server

# ---- Builder ----
FROM oven/bun:1.3 AS builder

WORKDIR /app

# Ensure we have a predictable production env during build steps
ENV NODE_ENV=production

# Build-time environment variables (provide defaults so build won't fail if no build-arg is passed)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Copy package files first to leverage Docker cache
COPY package.json bun.lock /app/

# Install all dependencies (including dev deps needed for build)
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . /app

# Run svelte-kit sync (prepare) and build (uses the project's build script)
# Allow svelte-kit sync to fail silently if it's not necessary for some environments
# Vite/SvelteKit reads VITE_* variables at build time, so we ensure VITE_API_BASE_URL is set via ARG/ENV above.
RUN bun x svelte-kit sync || true && bun run build

# Reinstall only production dependencies to keep final node_modules small
RUN bun install --production --frozen-lockfile


# ---- Runner ----
FROM oven/bun:1.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built output and production node_modules from builder stage
COPY --from=builder /app/build /app/build
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Create a non-root user and give ownership of /app
RUN addgroup --system app && adduser --system --ingroup app app && \
    chown -R app:app /app
USER app

# Expose a port commonly used by SvelteKit node adapter (adjust if needed)
EXPOSE 3000

# Default command runs the 'start' script which in package.json is "bun ./build/index.js"
CMD ["bun", "run", "start"]
