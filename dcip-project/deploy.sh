#!/bin/bash
# Run once on the server to make this script executable:
#   chmod +x deploy.sh
set -e

echo "Pulling latest from GitHub..."
git pull origin main

echo "Building backend..."
cd Backend && npm install --production=false && npm run build

echo "Restarting backend with PM2..."
pm2 restart dcip-backend || pm2 start ecosystem.config.js
pm2 save
cd ..

echo "Building frontend..."
cd Frontend && npm install && npm run build

echo "Copying frontend to web root..."
sudo cp -r dist/* /var/www/dcip/
cd ..

echo "Done. DCIP is updated and running."
