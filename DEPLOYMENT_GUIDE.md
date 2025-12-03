# PinQuest Production Deployment

## Overview
This document provides step-by-step instructions for deploying the PinQuest application in a production environment.

## Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or cloud)
- Redis (optional, for advanced caching)
- Cloudinary account (for image uploads)
- Firebase project (for authentication)

## Backend Setup

### Environment Variables
Create a `.env.production` file in the backend directory with the following:

```
NODE_ENV=production
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRE=7d
CLIENT_URL=https://yourdomain.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
```

### Installation and Deployment

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install production dependencies:
   ```bash
   npm install --production
   ```

3. Start the application:
   ```bash
   npm run start:prod
   ```

## Frontend Setup

### Environment Variables
Create a `.env.production` file in the frontend directory:

```
VITE_API_BASE_URL=https://yourdomain.com/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### Build and Deployment

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Serve the `dist` folder using a web server like Nginx or Apache.

## Reverse Proxy Configuration

Use Nginx as a reverse proxy to serve the frontend and proxy API requests to the backend:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## SSL Certificate Setup

For HTTPS, use Certbot to get a free SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Process Management

Use PM2 to manage the backend application in production:

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Create an ecosystem file `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'pinquest-backend',
       script: './server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       }
     }]
   };
   ```

3. Start the application:
   ```bash
   pm2 start ecosystem.config.js
   ```

4. Set up auto-start on reboot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Health Checks and Monitoring

The application provides health check endpoints:
- `GET /api/v1/health` - General health status
- `GET /api/v1/health/live` - Liveness probe
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/metrics` - Performance metrics

## Database Migrations

If implementing database migrations in the future, add this section with instructions for running migration scripts.

## Backup and Recovery

Set up regular backups for:
- MongoDB data
- Uploaded images/files
- Environment configuration files

Example backup script:
```bash
#!/bin/bash
BACKUP_DIR="/backups/pinquest"
DATE=$(date +%Y%m%d_%H%M%S)

# MongoDB backup
mongodump --out="$BACKUP_DIR/mongodb_$DATE"

# Uploaded files backup (if stored locally)
cp -r uploads "$BACKUP_DIR/uploads_$DATE"

# Compress backups
tar -czf "$BACKUP_DIR/pinquest_backup_$DATE.tar.gz" -C "$BACKUP_DIR" "mongodb_$DATE" "uploads_$DATE"

# Clean up uncompressed backups
rm -rf "$BACKUP_DIR/mongodb_$DATE" "$BACKUP_DIR/uploads_$DATE"
```

## Performance Tuning

- Enable gzip compression in your web server
- Set up CDN for static assets
- Configure proper caching headers
- Optimize database queries with indexes
- Monitor and tune Node.js memory usage