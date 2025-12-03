# Production Deployment Guide

This guide covers how to deploy the PinQuest application to a production environment.

## Environment Configuration

### Backend (.env.production)

```env
# Production Environment Configuration
NODE_ENV=production
PORT=5000
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/pinquest-prod?retryWrites=true&w=majority
JWT_SECRET=your_super_strong_production_jwt_secret_key_that_is_at_least_32_characters_long
JWT_EXPIRE=7d
CLIENT_URL=https://yourdomain.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_production_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM_EMAIL=your_production_email@gmail.com
REQUIRE_EMAIL_VERIFICATION=true

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_private_key\n-----END PRIVATE KEY-----"

# Redis Configuration (for session management, rate limiting, etc.)
REDIS_URL=redis://localhost:6379

# Logging level
LOG_LEVEL=INFO

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=15 * 60 * 1000
RATE_LIMIT_MAX_REQUESTS=100

# Security
SECURE_COOKIES=true
TRUST_PROXY=true
CSP_REPORT_ONLY=false
```

### Frontend (.env.production)

```env
# Production Environment Variables
VITE_API_BASE_URL=https://yourdomain.com/api/v1
VITE_FIREBASE_API_KEY=your_production_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_production_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_production_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_production_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_production_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_production_firebase_measurement_id

# Analytics and Monitoring
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your_sentry_dsn@sentry.io/project-id

# Security
VITE_SECURE_API_CALLS=true

# Build and Deployment
VITE_BASE_PATH=/
```

## Deployment Steps

### 1. Backend Deployment

1. Set up your production environment variables
2. Install dependencies: `npm install --production`
3. Run the application: `npm run start:prod`

### 2. Frontend Deployment

1. Build the application: `npm run build`
2. Serve the `dist` folder with your web server (Nginx, Apache, etc.)
3. Configure your domain with SSL certificate

## Docker Deployment (Optional)

Create a `Dockerfile` for the backend:

```Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Expose the port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start:prod"]
```

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongo:27017/pinquest
    depends_on:
      - mongo
    restart: unless-stopped

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped

volumes:
  mongo_data:
```

## Nginx Configuration (for frontend)

Create an nginx configuration file:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

## SSL Configuration

For HTTPS, use Let's Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Monitoring and Logging

The application includes health check endpoints:
- `GET /api/v1/health` - Comprehensive health check
- `GET /api/v1/health/live` - Liveness probe
- `GET /api/v1/health/ready` - Readiness probe
- `GET /api/v1/metrics` - Application metrics

## Backup Strategy

Set up regular backups of:
1. MongoDB database
2. Uploaded files directory
3. Environment configuration files

Example MongoDB backup script:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb+srv://..." --out="/backups/mongodb_$DATE"
```

## Performance Monitoring

Monitor application performance using:
1. APM tools like New Relic or DataDog
2. Server monitoring tools like PM2 or systemd
3. Database monitoring tools for MongoDB