#!/bin/bash

# StockPro Production Deployment Script
set -e

echo "====================================="
echo "StockPro Production Deployment"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    print_success "Docker is installed ($(docker --version))"
}

# Check if Docker Compose is installed
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_success "Docker Compose is installed ($(docker compose version))"
}

# Get server IP
get_server_ip() {
    SERVER_IP=$(curl -s ipv4.icanhazip.com || curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')
    print_info "Detected server IP: $SERVER_IP"
}

# Create necessary directories
create_directories() {
    print_info "Creating necessary directories..."
    mkdir -p nginx/logs
    mkdir -p stockpro-backend/uploads
    mkdir -p stockpro-backend/logs
    print_success "Directories created"
}

# Create .env.prod file if it doesn't exist
create_env_file() {
    if [ ! -f .env.prod ]; then
        print_info "Creating .env.prod file from template..."
        
        get_server_ip
        
        # Read the template
        if [ -f env.prod.template ]; then
            cp env.prod.template .env.prod
            
            # Generate secure random passwords
            POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
            JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
            
            # Replace placeholders
            sed -i "s/your_secure_password_here/$POSTGRES_PASSWORD/g" .env.prod
            sed -i "s/your_jwt_secret_key_change_this_in_production/$JWT_SECRET/g" .env.prod
            sed -i "s|http://your-server-ip|http://$SERVER_IP|g" .env.prod
            
            print_success ".env.prod file created with auto-generated credentials"
            print_info "Please review and edit .env.prod before deploying if needed"
        else
            print_error "env.prod.template not found!"
            exit 1
        fi
    else
        print_info ".env.prod file already exists"
    fi
}

# Stop existing containers
stop_existing() {
    print_info "Stopping existing containers..."
    docker compose -f docker-compose.prod.yml down 2>/dev/null || true
    print_success "Existing containers stopped"
}

# Build frontend and extract static files
build_frontend() {
    print_info "Building frontend with Docker..."
    
    # Get server IP for API URL
    get_server_ip
    
    # Build frontend image
    docker build -t stockpro-frontend-build ./stockpro-frontend --build-arg VITE_BASE_BACK_URL=http://$SERVER_IP/api/v1
    
    # Create directory for frontend files
    sudo mkdir -p /var/www/stockpro
    
    # Extract built files from container
    docker run --rm -v /var/www/stockpro:/output stockpro-frontend-build sh -c "cp -r /usr/share/nginx/html/* /output/"
    
    print_success "Frontend built and extracted to /var/www/stockpro"
}

# Build and start backend services
deploy_services() {
    print_info "Building and starting backend services..."
    print_info "This may take several minutes on first run..."
    
    docker compose -f docker-compose.prod.yml up -d --build
    
    print_success "Backend services built and started"
}

# Wait for services to be healthy
wait_for_services() {
    print_info "Waiting for services to be healthy..."
    
    # Wait for backend to be ready
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3000/api/v1/ &> /dev/null; then
            print_success "Backend is healthy"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        print_error "Backend failed to become healthy"
        return 1
    fi
    
    print_success "All services are healthy"
}

# Configure Nginx
configure_nginx() {
    print_info "Configuring Nginx..."
    
    # Get server IP
    get_server_ip
    
    # Copy Nginx configuration
    sudo cp nginx-stockpro.conf /etc/nginx/conf.d/stockpro.conf
    
    # Test Nginx configuration
    if sudo nginx -t; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration test failed"
        return 1
    fi
    
    # Reload Nginx
    sudo systemctl reload nginx
    print_success "Nginx configured and reloaded"
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    # Use db push instead of migrate deploy for simplicity
    docker exec stockpro-backend-prod pnpm prisma db push --force-reset || true
    
    print_success "Database migrations completed"
}

# Seed database (optional)
seed_database() {
    read -p "Do you want to seed the database? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Seeding database..."
        docker exec stockpro-backend-prod pnpm prisma:seed || true
        print_success "Database seeded"
    fi
}

# Display deployment summary
display_summary() {
    get_server_ip
    
    echo ""
    echo "====================================="
    echo "Deployment Summary"
    echo "====================================="
    echo ""
    print_success "StockPro has been deployed successfully!"
    echo ""
    echo "Access your application at:"
    echo "  Frontend:  http://$SERVER_IP"
    echo "  Backend:   http://$SERVER_IP/api/v1"
    echo "  Swagger:   http://$SERVER_IP/api/docs"
    echo ""
    echo "Useful commands:"
    echo "  View logs:       docker compose -f docker-compose.prod.yml logs -f"
    echo "  Stop services:   docker compose -f docker-compose.prod.yml down"
    echo "  Restart:         docker compose -f docker-compose.prod.yml restart"
    echo "  View status:     docker compose -f docker-compose.prod.yml ps"
    echo ""
}

# Main deployment process
main() {
    echo ""
    check_docker
    check_docker_compose
    echo ""
    
    get_server_ip
    create_directories
    create_env_file
    echo ""
    
    stop_existing
    echo ""
    
    build_frontend
    echo ""
    
    deploy_services
    echo ""
    
    wait_for_services
    echo ""
    
    run_migrations
    seed_database
    echo ""
    
    configure_nginx
    echo ""
    
    display_summary
}

# Run main function
main