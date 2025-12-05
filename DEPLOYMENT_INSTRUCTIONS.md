# PinQuest Deployment Guide

## Overview
PinQuest is a full-stack MERN application that allows users to pin locations on a map and share experiences. This guide covers the steps to deploy the application to production.

## Architecture
- **Frontend**: React 19 with Vite, Tailwind CSS, Leaflet for maps
- **Backend**: Node.js with Express, MongoDB, JWT authentication
- **Database**: MongoDB (with replica set)
- **File Storage**: Cloudinary for image uploads
- **Authentication**: Firebase and JWT
- **Real-time**: Socket.IO

## Prerequisites
- Node.js 18+
- MongoDB instance (local, Atlas, or self-hosted)
- Cloudinary account for image uploads
- Firebase project for authentication
- Docker and Docker Compose (for containerized deployment)

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://your-frontend-url.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password_here
SMTP_FROM_EMAIL=your_email@gmail.com
REQUIRE_EMAIL_VERIFICATION=true

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_private_key\n-----END PRIVATE KEY-----"
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://your-backend-url.com/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

## Deployment Options

### Option 1: Manual Deployment

#### Backend Deployment
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/pinquest.git
   cd pinquest/backend
   ```

2. Install dependencies:
   ```bash
   npm install --production
   ```

3. Set environment variables as shown above

4. Run the application:
   ```bash
   npm run start:prod
   ```

#### Frontend Deployment
1. Navigate to frontend directory:
   ```bash
   cd pinquest/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Serve with a static server (nginx, Apache, etc.)

### Option 2: Docker Deployment (Recommended)

1. Ensure all environment variables are set in both .env files

2. Build and run with Docker Compose:
   ```bash
   docker-compose up --build -d
   ```

3. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Option 3: Cloud Platform Deployment

#### Deploy to Heroku
1. Create Heroku apps:
   ```bash
   heroku create your-backend-app-name
   heroku create your-frontend-app-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set KEY=VALUE -a your-backend-app-name
   heroku config:set KEY=VALUE -a your-frontend-app-name
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

#### Deploy to AWS (ECS/EKS)
1. Build Docker images
2. Push to ECR
3. Create ECS cluster and deploy services
4. Set up Application Load Balancer

#### Deploy to Google Cloud (GKE)
1. Build Docker images
2. Push to Container Registry
3. Create GKE cluster
4. Deploy using kubectl

## Database Setup
1. Ensure MongoDB is accessible
2. The application will automatically create necessary collections
3. For production, use a MongoDB Atlas or properly configured replica set

## Cloudinary Setup
1. Create a Cloudinary account
2. Get your Cloud Name, API Key, and API Secret
3. Configure upload presets for security

## SSL/HTTPS Configuration
For production deployment, ensure you have SSL certificates configured:
- Use Let's Encrypt for free certificates
- Cloudflare for CDN and SSL termination
- AWS Certificate Manager for AWS deployments

## Monitoring and Logging
- The application includes health check endpoints:
  - `/api/v1/health` - Overall health
  - `/api/v1/health/live` - Liveness probe
  - `/api/v1/health/ready` - Readiness probe
- Add external monitoring tools like New Relic, Datadog, or CloudWatch

## Performance Optimizations
1. The frontend has large chunks that can be optimized with code splitting
2. Use CDN for static assets
3. Implement caching strategies
4. Optimize database queries with proper indexing

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure CLIENT_URL matches the frontend URL
2. **Database connection**: Verify MONGODB_URL is correct and accessible
3. **Cloudinary upload**: Check API credentials and CORS settings
4. **Firebase auth**: Verify Firebase configuration and domain settings

### Health Checks
Use the health check endpoints to monitor application status:
```bash
curl http://your-domain.com/api/v1/health
```

## Scaling
- Use PM2 for Node.js process management
- Implement Redis for session and cache management
- Use load balancers for horizontal scaling
- Database read replicas for high traffic

## Security Considerations
- Enable helmet.js security headers
- Use rate limiting
- Sanitize input data
- Validate JWT tokens
- Secure MongoDB connection
- HTTPS enforcement

## Rollback Plan
1. Keep previous version build artifacts
2. Use blue-green deployment strategy
3. Maintain database migration scripts
4. Test rollback procedures regularly

## Maintenance
- Regular security updates
- Database backup procedures
- Log rotation
- Performance monitoring
- Dependency updates