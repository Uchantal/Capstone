#!/bin/bash
set -e

# Always run relative to the directory this script lives in
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Pulling latest from GitHub..."
cd "$PROJECT_DIR"
git pull origin main

echo "Building backend..."
cd "$PROJECT_DIR/Backend"
npm install --production=false
npm run build

echo "Restarting backend with PM2..."
cd "$PROJECT_DIR"
pm2 restart dcip-backend || pm2 start Backend/ecosystem.config.js
pm2 save

echo "Building frontend..."
cd "$PROJECT_DIR/Frontend"
npm install
npm run build

echo "Copying frontend to web root..."
sudo cp -r dist/* /var/www/dcip/

echo "Applying Nginx config..."
sudo cp "$PROJECT_DIR/nginx.conf" /etc/nginx/sites-available/dcip-rw.online
sudo nginx -t && sudo systemctl reload nginx

echo "Done. DCIP is updated and running."
