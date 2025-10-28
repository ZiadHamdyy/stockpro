# 1. Stop services
docker compose -f /root/stockpro/docker-compose.prod.yml down
sudo systemctl stop nginx

# 2. Build and extract frontend
docker build -t stockpro-frontend-build ./stockpro-frontend --build-arg VITE_BASE_BACK_URL=http://72.61.165.87/api/v1
docker run --rm -v /var/www/stockpro:/output stockpro-frontend-build sh -c "cp -r /usr/share/nginx/html/* /output/"

# 3. Start backend services
docker compose -f /root/stockpro/docker-compose.prod.yml up -d

# 4. Wait for services and run migrations
sleep 30
docker exec stockpro-backend-prod pnpm prisma db push --force-reset
docker exec stockpro-backend-prod pnpm prisma:seed

# 5. Start Nginx
sudo systemctl start nginx