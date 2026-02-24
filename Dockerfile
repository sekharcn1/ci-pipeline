# ============================================
# Stage 1: Install ALL dependencies and test
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first (leverage Docker layer caching)
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for testing)
RUN npm ci

# Copy application source
COPY app.js app.test.js ./

# Run tests inside the build stage
RUN npm test

# ============================================
# Stage 2: Production dependencies only
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./

# Install ONLY production dependencies (no dev deps)
RUN npm ci --omit=dev && npm cache clean --force

# ============================================
# Stage 3: Final minimal runtime image
# ============================================
FROM node:20-alpine AS runtime

# Add non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only the application code (no test files, no dev configs)
COPY app.js package.json ./

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "app.js"]
