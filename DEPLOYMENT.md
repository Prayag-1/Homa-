# HOMA Production Deployment Guide

## Prerequisites
- Ubuntu 22.04 VPS (Babal Host)
- Node.js v20 LTS installed
- PM2 installed globally: `npm install -g pm2`
- Nginx installed: `apt install -y nginx`
- Certbot installed: `apt install -y certbot python3-certbot-nginx`
- MongoDB Atlas cluster set up with IP whitelist

## First-Time Deployment Steps

### Step 1: Clone the repository
```bash
cd /var/www
git clone https://github.com/Prayag-1/Homa-.git homa
cd homa
```

### Step 2: Set up server environment
```bash
cd server
cp .env.production.example .env
nano .env  # Fill in all production values
```

### Step 3: Install server dependencies
```bash
npm install --production
```

### Step 4: Generate secure JWT secrets
```bash
node src/scripts/generateSecrets.js
# Copy output into .env for JWT_SECRET and JWT_REFRESH_SECRET
```

### Step 5: Create required log directory
```bash
mkdir -p /var/log/homa
```

### Step 6: Ensure MongoDB indexes
```bash
node src/scripts/ensureIndexes.js
```

### Step 7: Initialize site settings
```bash
node src/scripts/initSiteSettings.js
```

### Step 8: Seed initial data
```bash
node src/scripts/seedBrandsCategories.js
```

### Step 9: Create admin user
```bash
node src/scripts/createAdmin.js
# IMPORTANT: Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD in .env first.
# Change the temporary password immediately after first login.
```

### Step 10: Start server with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Run the command it outputs to enable auto-start
```

### Step 11: Build the frontend
```bash
cd ../client
cp .env.production.example .env
nano .env  # Set VITE_API_URL=https://api.homabeauty.com/api/v1
npm install
npm run build
# Output is in client/dist/
```

### Step 12: Configure Nginx
```bash
cp ../server/nginx.homa.conf /etc/nginx/sites-available/homa
ln -s /etc/nginx/sites-available/homa /etc/nginx/sites-enabled/
nginx -t  # Test config - must say 'syntax is ok'
systemctl reload nginx
```

### Step 13: Set up SSL
```bash
certbot --nginx -d homabeauty.com -d www.homabeauty.com -d api.homabeauty.com
# Follow prompts, enter email, agree to terms
certbot renew --dry-run  # Test auto-renewal
```

### Step 14: Verify deployment
```bash
curl https://api.homabeauty.com/api/v1/health
# Should return: {"success":true,"status":"ok","database":"connected"}
# Visit https://homabeauty.com in browser
```

### Step 15: Regenerate Cloudinary API Secret
IMPORTANT: The Cloudinary API secret was exposed earlier in a conversation. Before going live:
1. Go to Cloudinary dashboard -> Settings -> Access Keys
2. Regenerate API Secret
3. Update server/.env with the new secret
4. Restart PM2: `pm2 restart homa-api`

## Update Deployment (after code changes)
```bash
cd /var/www/homa
git pull origin main

# Update server
cd server
npm install --production
pm2 restart homa-api

# Update frontend
cd ../client
npm install
npm run build
# Nginx auto-serves the new build from client/dist/
```

## Production Checklist

### Environment
- [ ] `NODE_ENV=production` in server `.env`
- [ ] No localhost in any production env file
- [ ] `JWT_SECRET` is 64+ random characters
- [ ] `JWT_REFRESH_SECRET` is different from `JWT_SECRET`
- [ ] Cloudinary API Secret regenerated
- [ ] eSewa payment URL is live, not sandbox
- [ ] eSewa success/failure URLs point to `homabeauty.com`
- [ ] Fonepay return URL points to `homabeauty.com`
- [ ] `HOMA_PAN` is the real registered PAN number

### Backend
- [ ] `pm2 status` shows `homa-api` as online
- [ ] `GET /api/v1/health` returns `database: connected`
- [ ] Stack traces are not returned in API errors
- [ ] Rate limiters active
- [ ] MongoDB Atlas IP whitelist set to VPS IP only
- [ ] All seed scripts have run successfully
- [ ] Admin temporary password has been changed

### Frontend
- [ ] `npm run build` completes without errors
- [ ] `VITE_API_URL` points to `api.homabeauty.com`
- [ ] No localhost URLs in the built JS bundle
- [ ] All routes work through Nginx
- [ ] Cart, wishlist, and login work on the live domain

### Payments
- [ ] eSewa live payment works
- [ ] Fonepay live payment works if enabled in code
- [ ] COD order creation works
- [ ] VAT invoice PDF generates and is downloadable
- [ ] Order confirmation email is received after payment

### SSL & Nginx
- [ ] HTTPS works on `homabeauty.com`
- [ ] HTTPS works on `api.homabeauty.com`
- [ ] HTTP redirects to HTTPS automatically
- [ ] SSL certificate is valid
- [ ] `certbot renew --dry-run` passes

### Data
- [ ] MongoDB Atlas automatic backup is enabled
- [ ] At least 1 brand exists in `brands`
- [ ] At least 1 category exists in `categories`
- [ ] SiteSettings document exists
- [ ] At least 1 admin user exists
