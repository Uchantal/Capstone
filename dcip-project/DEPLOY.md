# DCIP Deployment Guide — DigitalOcean VPS

---

## PART 1 — CREATE THE DROPLET

1. Go to [digitalocean.com](https://digitalocean.com) and create an account.
2. Click **Create → Droplets** and configure:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic, Regular, 1 GB RAM / 1 vCPU ($6/month)
   - **Region:** Frankfurt (closest to Rwanda with good latency)
   - **Authentication:** SSH key (recommended) or root password
3. Click **Create Droplet** and note your Droplet IP address.

---

## PART 2 — CONNECT TO THE DROPLET

```bash
ssh root@YOUR_DROPLET_IP
```

---

## PART 3 — SERVER SETUP (run once)

**Update the server:**
```bash
apt update && apt upgrade -y
```

**Install Node.js 20:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

**Verify Node.js:**
```bash
node --version   # should show v20.x.x
npm --version
```

**Install PM2 globally:**
```bash
npm install -g pm2
```

**Install Nginx:**
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

**Install Git:**
```bash
apt install -y git
```

---

## PART 4 — CLONE THE REPOSITORY

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/Uchantal/Capstone.git

cd Capstone/dcip-project
```

---

## PART 5 — CONFIGURE ENVIRONMENT VARIABLES

```bash
cd Backend
nano .env
```

Add these variables (replace with your real values):
```
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_string_minimum_32_characters
CLIENT_URL=https://dcip-rw.online
FRONTEND_URL=https://dcip-rw.online
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Save and exit: **Ctrl+X → Y → Enter**

---

## PART 6 — BUILD AND START THE BACKEND

```bash
npm install
npm run build
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

> Copy and run the exact command that `pm2 startup` prints — it starts PM2 automatically on server reboot.

**Verify the backend is running:**
```bash
pm2 status
curl http://localhost:5000/api/health
```
Expected response:
```json
{ "status": "ok", "platform": "DCIP", "timestamp": "...", "environment": "production" }
```

---

## PART 7 — BUILD THE FRONTEND

```bash
cd ../Frontend
npm install
npm run build
mkdir -p /var/www/dcip
cp -r dist/* /var/www/dcip/
```

---

## PART 8 — CONFIGURE NGINX

```bash
cp /var/www/Capstone/dcip-project/nginx.conf /etc/nginx/sites-available/dcip
ln -s /etc/nginx/sites-available/dcip /etc/nginx/sites-enabled/dcip
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## PART 9 — TEST THE DEPLOYMENT

Open in browser: `http://YOUR_DROPLET_IP` (before the domain is wired up)

Backend health check: `http://YOUR_DROPLET_IP/api/health`

Once the domain is active: `https://dcip-rw.online`

You should see the DCIP homepage and the health endpoint returning:
```json
{ "status": "ok", "platform": "DCIP", "timestamp": "...", "environment": "production" }
```

---

## PART 10 — ADD A DOMAIN NAME

> The platform domain is **dcip-rw.online**. Steps below are already complete
> for the current deployment — keep this section for reference or re-setup.

1. Point `dcip-rw.online` **A record** to `YOUR_DROPLET_IP` in your DNS provider.
2. Wait for DNS propagation (up to 24 hours).
3. `nginx.conf` already has `server_name dcip-rw.online www.dcip-rw.online;` — copy it to the server:
   ```bash
   cp /var/www/Capstone/dcip-project/nginx.conf /etc/nginx/sites-available/dcip
   nginx -t && systemctl restart nginx
   ```
4. Install a free HTTPS certificate with Certbot:
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d dcip-rw.online -d www.dcip-rw.online
   ```
   Follow the prompts — select the option to redirect HTTP to HTTPS.
5. Verify: `https://dcip-rw.online`
6. Update both `CLIENT_URL` and `FRONTEND_URL` in `Backend/.env` to `https://dcip-rw.online`:
   ```
   CLIENT_URL=https://dcip-rw.online
   FRONTEND_URL=https://dcip-rw.online
   ```
   Then restart the backend:
   ```bash
   pm2 restart dcip-backend
   ```
   > `CLIENT_URL` controls which origins the CORS policy allows.
   > `FRONTEND_URL` is used to build the link inside password-reset emails —
   > if it still points to `http://`, reset links will break once HTTPS is active.

---

---

## PART 11 — FUTURE UPDATES

After pushing changes to GitHub, SSH into the server and run:

```bash
cd /var/www/Capstone/dcip-project
bash deploy.sh
```

This pulls the latest code, rebuilds both frontend and backend, restarts the backend with PM2, and copies the new frontend build to the web root automatically.

---

## Useful PM2 Commands

```bash
pm2 list                           # View running processes
pm2 logs dcip-backend              # Stream live logs
pm2 logs dcip-backend --lines 50   # Last 50 log lines
pm2 restart dcip-backend           # Restart the backend
pm2 stop dcip-backend              # Stop the backend
```

## Useful Nginx Commands

```bash
nginx -t                           # Test config for syntax errors
systemctl restart nginx            # Apply config changes
systemctl status nginx             # Check Nginx is running
tail -f /var/log/nginx/error.log   # Stream Nginx error log
```
