# Multi-stage build for React frontend

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS build

WORKDIR /app

# Accept build argument for VITE_BASE_BACK_URL first
ARG VITE_BASE_BACK_URL
ENV VITE_BASE_BACK_URL=$VITE_BASE_BACK_URL

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package*.json ./

# Install all dependencies (including devDependencies) for build
RUN npm ci

# Copy source code (this will preserve the .env.production if it exists)
COPY . .

# Create .env.production with the build argument if it doesn't exist
RUN echo "VITE_BASE_BACK_URL=$VITE_BASE_BACK_URL" > .env.production

# Build the application
RUN npm run build

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

