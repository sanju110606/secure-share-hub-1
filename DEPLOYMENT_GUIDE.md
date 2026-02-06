# Deployment Guide

This guide provides comprehensive instructions for deploying Secure Share Hub to production.

## Table of Contents
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
- [Backend Deployment](#backend-deployment)
- [Production Checklist](#production-checklist)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Quick Start with Docker

The fastest way to deploy is using Docker Compose:

### Development Environment
```bash
# Clone repository
git clone https://github.com/vinay-2006/secure-share-hub.git
cd secure-share-hub

# Create environment files
cp .env.example .env
cp server/.env.example server/.env

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017

### Production Environment
```bash
# Use production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

## Manual Deployment

### Prerequisites
- Node.js 18 or higher
- MongoDB 5 or higher
- npm or yarn
- Git

### Backend Deployment

#### 1. Prepare Backend
```bash
cd server

# Install dependencies
npm ci --production

# Build TypeScript
npm run build

# Set environment variables
export NODE_ENV=production
export MONGODB_URI=your-mongodb-connection-string
export JWT_SECRET=your-secure-jwt-secret
export JWT_REFRESH_SECRET=your-secure-refresh-secret
export CORS_ORIGIN=https://your-frontend-domain.com

# Start server
npm start
```

#### 2. Backend Environment Variables
Create `server/.env`:
```env
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://username:password@host:27017/secure-share-hub?authSource=admin

# JWT Configuration
JWT_SECRET=generate-strong-random-string-min-32-chars
JWT_REFRESH_SECRET=generate-another-strong-random-string
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Email (for future features)
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=your-email@example.com
# SMTP_PASSWORD=your-email-password

# Optional: Redis (for caching)
# REDIS_URL=redis://localhost:6379

# Optional: Monitoring
# SENTRY_DSN=your-sentry-dsn
```

#### 3. Database Seeding
```bash
# Seed initial admin user
cd server
npm run seed
```

Default admin credentials:
- Email: admin@example.com
- Password: Admin123!

**⚠️ IMPORTANT: Change these credentials immediately after first login!**

### Frontend Deployment

#### 1. Build Frontend
```bash
# Install dependencies
npm ci

# Build for production
VITE_API_URL=https://your-backend-api.com/api npm run build

# The build output will be in the `dist` directory
```

#### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`
5. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-api.com/api`
6. Click "Deploy"

#### 3. Deploy to Nginx (Alternative)
```bash
# Copy built files to web server
scp -r dist/* user@server:/var/www/secure-share-hub/

# Configure Nginx
sudo nano /etc/nginx/sites-available/secure-share-hub
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    root /var/www/secure-share-hub;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (if backend on same server)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Environment Configuration

### Generating Secure Secrets
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Environment Files

**Frontend (.env)**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Backend (server/.env)**
See [Backend Environment Variables](#2-backend-environment-variables) above.

## Database Setup

### MongoDB Atlas (Recommended)
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database user
4. Whitelist your application's IP address (or use 0.0.0.0/0 for all IPs)
5. Get connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/secure-share-hub?retryWrites=true&w=majority
   ```

### Local MongoDB
```bash
# Install MongoDB
# Ubuntu/Debian
sudo apt install mongodb

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Connection string
mongodb://localhost:27017/secure-share-hub
```

## Backend Deployment Options

### Option 1: Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Link to your project
railway link

# Deploy
railway up

# Set environment variables in Railway dashboard
```

### Option 2: Render
1. Sign up at https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: secure-share-hub-backend
   - Root Directory: `server`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Add environment variables
5. Click "Create Web Service"

### Option 3: DigitalOcean App Platform
1. Sign up at https://www.digitalocean.com
2. Create new app
3. Connect GitHub repository
4. Configure:
   - Source Directory: `/server`
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Add environment variables
5. Deploy

### Option 4: AWS EC2
```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
# Follow MongoDB installation guide for your OS

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone https://github.com/vinay-2006/secure-share-hub.git
cd secure-share-hub/server

# Install dependencies
npm ci --production

# Set environment variables
nano .env

# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name secure-share-hub-api

# Save PM2 configuration
pm2 save
pm2 startup

# Monitor
pm2 monit
```

## Production Checklist

### Security
- [ ] Change default admin password
- [ ] Use strong, unique JWT secrets (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS origins (no wildcards)
- [ ] Use production MongoDB with authentication
- [ ] Set secure password policies
- [ ] Enable rate limiting
- [ ] Keep dependencies updated
- [ ] Set proper file upload limits
- [ ] Use environment variables for all secrets

### Performance
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure proper caching headers
- [ ] Optimize database indexes
- [ ] Set up connection pooling
- [ ] Configure proper resource limits

### Monitoring
- [ ] Set up application logging
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring
- [ ] Set up database monitoring
- [ ] Configure alerts

### Backup
- [ ] Configure database backups (daily)
- [ ] Set up file storage backups
- [ ] Test backup restoration
- [ ] Document backup procedures

## Monitoring & Maintenance

### Application Logs
```bash
# View logs (Docker)
docker-compose logs -f backend

# View logs (PM2)
pm2 logs secure-share-hub-api

# View logs (systemd)
sudo journalctl -u secure-share-hub -f
```

### Health Checks
```bash
# Check API health
curl https://your-api-domain.com/api/health

# Expected response
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-06T12:00:00.000Z"
  }
}
```

### Database Maintenance
```bash
# MongoDB backup
mongodump --uri="your-mongodb-uri" --out=/backup/$(date +%Y%m%d)

# MongoDB restore
mongorestore --uri="your-mongodb-uri" /backup/20240206

# Check database size
mongo your-database --eval "db.stats()"
```

### Updates
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Rebuild and restart
npm run build
pm2 restart secure-share-hub-api
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs

# Check environment variables
printenv | grep NODE_ENV

# Verify MongoDB connection
mongo your-mongodb-uri
```

### Connection Issues
```bash
# Check port availability
netstat -tuln | grep 5000

# Check firewall
sudo ufw status

# Test API endpoint
curl http://localhost:5000/api/health
```

### File Upload Issues
```bash
# Check upload directory permissions
ls -la server/uploads/
chmod 755 server/uploads/

# Check disk space
df -h
```

### Database Connection Issues
```bash
# Test MongoDB connection
mongosh "your-mongodb-uri"

# Check MongoDB status
sudo systemctl status mongodb

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Performance Issues
```bash
# Check CPU/Memory usage
top
htop

# Check application metrics
pm2 monit

# Analyze slow queries
mongo --eval "db.currentOp()"
```

## Scaling

### Horizontal Scaling
- Deploy multiple backend instances behind a load balancer
- Use Redis for session storage
- Use cloud storage (S3, CloudFlare R2) for file uploads
- Configure sticky sessions or stateless authentication

### Load Balancing (Nginx)
```nginx
upstream backend {
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/vinay-2006/secure-share-hub/issues
- Documentation: Check README.md and other docs
- Security Issues: Report privately to maintainers

---

**Last Updated:** 2024-02-06
**Version:** 2.0.0
