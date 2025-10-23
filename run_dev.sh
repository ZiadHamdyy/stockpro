#!/bin/bash

echo "🚀 Starting StockPro development environment..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.dev.yml down

# Remove any leftover containers with conflicting names
docker rm -f stockpro-frontend >/dev/null 2>&1 || true
docker rm -f stockpro-backend-dev >/dev/null 2>&1 || true
docker rm -f stockpro-postgres-dev >/dev/null 2>&1 || true
docker rm -f stockpro-prisma-studio-dev >/dev/null 2>&1 || true

# Build and start the development environment
echo "🔨 Building and starting development environment..."
docker compose -f docker-compose.dev.yml up --build

echo "✅ Development environment is ready!"
echo "📱 Backend will be available at: http://localhost:4000"
echo "📱 Frontend will be available at: http://localhost:3000"
echo "🗄️  Database will be available at: localhost:5432"
echo "🔍 Prisma Studio will be available at: http://localhost:5555"
echo "💡 To stop the environment, run: docker-compose -f docker-compose.dev.yml down"
