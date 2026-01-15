# Email Verification API Documentation

## Overview
This document describes the email verification functionality implemented in the PinQuest platform. The system sends a verification code to the user's email and requires them to enter the code to verify their account before they can fully access the platform.

## New API Endpoints

### 1. Register with Verification
- **Endpoint**: `POST /api/v1/auth/register-with-verification`
- **Description**: Registers a new user and sends a verification code to their email
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "email": "string (required, must be valid email)",
    "password": "string (required, min 6 characters)"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "status": "success",
    "message": "User created successfully. Please check your email for the verification code.",
    "data": {
      "_id": "user_id",
      "name": "user_name",
      "email": "user_email"
    }
  }
  ```
- **Response (Error)**:
  ```json
  {
    "status": "fail/error",
    "message": "Error message"
  }
  ```

### 2. Verify Email
- **Endpoint**: `POST /api/v1/auth/verify-email`
- **Description**: Verifies the user's email using the code sent to their email
- **Request Body**:
  ```json
  {
    "email": "string (required)",
    "code": "string (required, 6-digit verification code)"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "status": "success",
    "message": "Email verified successfully",
    "data": {
      "_id": "user_id",
      "name": "user_name",
      "email": "user_email",
      "token": "JWT_token"
    }
  }
  ```
- **Response (Error)**:
  ```json
  {
    "status": "fail",
    "message": "Invalid or expired verification code / Error message"
  }
  ```

### 3. Resend Verification Code
- **Endpoint**: `POST /api/v1/auth/resend-verification`
- **Description**: Sends a new verification code to the user's email
- **Request Body**:
  ```json
  {
    "email": "string (required)"
  }
  ```
- **Response (Success)**:
  ```json
  {
    "status": "success",
    "message": "Verification code resent successfully. Please check your email."
  }
  ```
- **Response (Error)**:
  ```json
  {
    "status": "fail/error",
    "message": "Error message"
  }
  ```

## Updated API Endpoints

### 1. Register
- **Endpoint**: `POST /api/v1/auth/register`
- **Description**: Updated to support optional verification requirement
- **Request Body**:
  ```json
  {
    "name": "string (required)",
    "email": "string (required)",
    "password": "string (required)",
    "requireVerification": "boolean (optional, defaults to false)"
  }
  ```

### 2. Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Description**: Updated to check if email verification is required
- **Changes**: If `REQUIRE_EMAIL_VERIFICATION` environment variable is set to `true`, users with unverified emails will be denied access

## Environment Variables

The following environment variables need to be configured for email verification to work:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com                    # SMTP server host
SMTP_PORT=587                              # SMTP server port
SMTP_EMAIL=your_email@gmail.com            # Email address to send from
SMTP_PASSWORD=your_app_password_here       # App password for the email
SMTP_FROM_EMAIL=your_email@gmail.com       # Display email address
REQUIRE_EMAIL_VERIFICATION=true            # Whether email verification is required (true/false)
```

## Database Changes

The User model has been updated with the following new fields:
- `verificationCode` (String): The current verification code
- `verificationCodeExpires` (Date): When the verification code expires
- `isVerified` (Boolean): Whether the email is verified (already existed but now enforced)

## Frontend Integration

### Components Added
- `EmailVerification.jsx`: Component for entering the 6-digit verification code

### Routes Added
- `/verify-email`: Route for the email verification component

### Auth Context Changes
- Added `signupWithVerification` function to handle registration with verification

## Email Templates

The system sends professional HTML emails with:
- 6-digit verification code prominently displayed
- 10-minute expiration notice
- Responsive design
- Branding elements

## Verification Flow

1. User registers via `/register-with-verification` or `/register` with `requireVerification: true`
2. System creates user account with unverified status
3. System generates 6-digit code with 10-minute expiration
4. System sends verification email to user
5. User enters code on verification page
6. System verifies code and updates user to verified status
7. System generates JWT token and returns to user
8. User can now access the full platform

## Security Features

- Verification codes expire after 10 minutes
- Codes are stored encrypted in the database
- Only one active verification code per user at a time
- Email verification can be required or optional based on environment settings