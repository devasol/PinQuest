# Firebase Setup Guide

This guide will help you properly configure Firebase for your PinQuest application.

## Frontend Configuration

Your Firebase configuration is in `frontend/src/config/firebase.js`. It currently uses environment variables:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

## Backend Configuration (Firebase Admin SDK)

For server-side Firebase token verification, you need to configure the Firebase Admin SDK with service account credentials:

1. Go to the Firebase Console
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate New Private Key"
5. This will download a JSON file with your credentials
6. Add the following to your `backend/.env` file:

```
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nLONG_PRIVATE_KEY_STRING_HERE_WITH_NEWLINES_REPLACED_BY_\n\n-----END PRIVATE KEY-----\n"
```

Note: The private key must have newlines replaced with `\n` characters for proper environment variable handling.

## Development Without Firebase Admin SDK

If you don't want to set up Firebase Admin SDK (not recommended for production), the application has a fallback mechanism that will allow basic functionality during development. However, proper token verification will not occur, which is a security risk.

## Environment Variables Setup

1. Create `frontend/.env` with your Firebase configuration:

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

2. Create `backend/.env` with your server configuration:

```
PORT=5000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_private_key_with_newlines_replaced_by_\n"
```

## Running the Application

1. Frontend: `cd frontend && npm install && npm run dev`
2. Backend: `cd backend && npm install && npm run dev`

The application will work with the fallback mechanism if Firebase Admin SDK is not configured, but for production you should properly configure the Firebase Admin SDK.