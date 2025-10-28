# Production build for NestJS backend

FROM node:18-alpine

WORKDIR /app

# Install pnpm and PostgreSQL client tools
RUN npm install -g pnpm && \
    apk add --no-cache postgresql-client

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code and prisma schema
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Build the application
RUN pnpm run build

# Create directories for uploads and logs
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3000

# Start the application in production mode
CMD ["node", "dist/src/main"]
