# Multi-stage build for React frontend

# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Accept build argument for VITE_BASE_BACK_URL first
ARG VITE_BASE_BACK_URL
ENV VITE_BASE_BACK_URL=$VITE_BASE_BACK_URL

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies) for build
RUN pnpm install --frozen-lockfile

# Copy source code (this will preserve the .env.production if it exists)
COPY . .

# Create .env.production with the build argument if it doesn't exist
RUN echo "VITE_BASE_BACK_URL=$VITE_BASE_BACK_URL" > .env.production

# Build the application
RUN pnpm run build

# Stage 3: Production with Nginx
FROM nginx:alpine AS production

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

