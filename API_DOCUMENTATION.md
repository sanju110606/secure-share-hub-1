# API Documentation

Complete API reference for Secure Share Hub backend.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-api-domain.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)
- No spaces

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

---

### Login
Authenticate a user.

**Endpoint:** `POST /api/auth/login`

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Account Lockout:**
- After 5 failed login attempts, account is locked for 15 minutes
- Response includes `attemptsRemaining` field
- Lockout response: `423 Locked`

---

### Admin Login
Authenticate as admin.

**Endpoint:** `POST /api/auth/admin/login`

**Rate Limit:** 5 requests per 15 minutes per IP

**Request Body:** Same as user login

---

### Refresh Token
Get a new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get Current User
Get authenticated user's information.

**Endpoint:** `GET /api/auth/me`

**Headers:** Requires authentication

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-02-06T12:00:00.000Z"
    }
  }
}
```

---

### Request Password Reset
Request a password reset token.

**Endpoint:** `POST /api/auth/password/reset-request`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Password reset token generated",
    "resetToken": "a1b2c3d4e5f6..."
  }
}
```

**Note:** In production, the token should be sent via email instead of in response.

---

### Reset Password
Reset password using reset token.

**Endpoint:** `POST /api/auth/password/reset`

**Request Body:**
```json
{
  "token": "a1b2c3d4e5f6...",
  "newPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Password reset successful"
  }
}
```

---

### Logout
Logout current user (client-side token removal).

**Endpoint:** `POST /api/auth/logout`

**Response:** `200 OK`

---

## File Endpoints

### Upload File
Upload a new file.

**Endpoint:** `POST /api/files/upload`

**Headers:** 
- Requires authentication
- Content-Type: multipart/form-data

**Rate Limit:** 10 uploads per 15 minutes per IP

**Form Data:**
```
file: <binary data>
maxDownloads: 5 (optional, default: 0 = unlimited)
expiryHours: 48 (optional, default: 24)
visibility: private (optional, values: private|public, default: private)
```

**Allowed File Types:**
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT
- Images: JPG, JPEG, PNG, GIF, WEBP, SVG
- Archives: ZIP, RAR, 7Z

**Max File Size:** 50MB

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "507f1f77bcf86cd799439011",
      "name": "document.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "uploadedAt": "2024-02-06T12:00:00.000Z",
      "accessToken": "abc123xyz789",
      "expiryTimestamp": "2024-02-08T12:00:00.000Z",
      "maxDownloads": 5,
      "usedDownloads": 0,
      "status": "active",
      "visibility": "private"
    }
  }
}
```

**File Validation:**
- MIME type validation
- File extension validation
- Magic number (file signature) validation
- File size validation
- Filename sanitization (removes path traversal attempts)
- Image optimization and EXIF removal (for images)

---

### Get User Files
Get all files uploaded by authenticated user.

**Endpoint:** `GET /api/files`

**Headers:** Requires authentication

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "document.pdf",
        "size": 1048576,
        "type": "application/pdf",
        "uploadedAt": "2024-02-06T12:00:00.000Z",
        "accessToken": "abc123xyz789",
        "expiryTimestamp": "2024-02-08T12:00:00.000Z",
        "maxDownloads": 5,
        "usedDownloads": 2,
        "status": "active",
        "visibility": "private"
      }
    ]
  }
}
```

---

### Get File by ID
Get file details by ID.

**Endpoint:** `GET /api/files/:id`

**Headers:** Requires authentication

**Response:** `200 OK` (same as Get User Files, single file)

---

### Access File by Token
Validate access token and get file metadata.

**Endpoint:** `GET /api/files/access/:token`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "507f1f77bcf86cd799439011",
      "name": "document.pdf",
      "size": 1048576,
      "type": "application/pdf",
      "uploadedAt": "2024-02-06T12:00:00.000Z",
      "expiryTimestamp": "2024-02-08T12:00:00.000Z",
      "maxDownloads": 5,
      "usedDownloads": 2,
      "visibility": "private",
      "uploadedByName": "John Doe"
    }
  }
}
```

**Error Cases:**
- `404`: File not found
- `403`: Link expired, revoked, or download limit exceeded

---

### Download File
Download file using access token.

**Endpoint:** `GET /api/files/download/:token`

**Rate Limit:** 50 downloads per 15 minutes per IP

**Response:** Binary file download

**Headers:**
```
Content-Disposition: attachment; filename="document.pdf"
Content-Type: application/pdf
```

**Error Cases:**
- `404`: File not found
- `403`: Link expired, revoked, or download limit exceeded

---

### Regenerate Access Token
Generate a new access token for a file.

**Endpoint:** `PATCH /api/files/:id/regenerate-token`

**Headers:** Requires authentication

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "507f1f77bcf86cd799439011",
      "accessToken": "new_token_xyz789",
      "expiryTimestamp": "2024-02-07T12:00:00.000Z",
      "status": "active"
    }
  }
}
```

---

### Revoke File Access
Revoke access to a file.

**Endpoint:** `PATCH /api/files/:id/revoke`

**Headers:** Requires authentication

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "507f1f77bcf86cd799439011",
      "status": "revoked"
    }
  }
}
```

---

### Delete File
Permanently delete a file.

**Endpoint:** `DELETE /api/files/:id`

**Headers:** Requires authentication

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "File deleted successfully"
  }
}
```

---

## Admin Endpoints

All admin endpoints require authentication with admin role.

### Get Statistics
Get system statistics.

**Endpoint:** `GET /api/admin/stats`

**Headers:** Requires admin authentication

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "totalFiles": 1250,
      "totalStorage": 5368709120,
      "activeFiles": 1100,
      "revokedFiles": 150,
      "totalDownloads": 5430
    }
  }
}
```

---

### Get All Users
Get list of all users.

**Endpoint:** `GET /api/admin/users`

**Headers:** Requires admin authentication

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "createdAt": "2024-02-01T12:00:00.000Z",
        "filesCount": 15,
        "storageUsed": 52428800
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalUsers": 150
    }
  }
}
```

---

### Get All Files
Get list of all files (admin view).

**Endpoint:** `GET /api/admin/files`

**Headers:** Requires admin authentication

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `status`: Filter by status (active|revoked)

**Response:** Similar to Get User Files but for all files

---

### Delete User
Delete a user and all their files.

**Endpoint:** `DELETE /api/admin/users/:id`

**Headers:** Requires admin authentication

**Response:** `200 OK`

---

## Activity Endpoints

### Get File Activities
Get activity log for a specific file.

**Endpoint:** `GET /api/activities/file/:fileId`

**Headers:** Requires authentication (owner or admin)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "507f1f77bcf86cd799439011",
        "fileId": "507f1f77bcf86cd799439012",
        "eventType": "download_success",
        "status": "success",
        "details": "File downloaded successfully",
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-02-06T12:00:00.000Z"
      }
    ]
  }
}
```

---

## Health Check

### Get API Health
Check if API is running.

**Endpoint:** `GET /api/health`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-06T12:00:00.000Z"
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Common Error Codes

**Authentication:**
- `NOT_AUTHENTICATED` (401): Missing or invalid authentication token
- `INVALID_CREDENTIALS` (401): Invalid email or password
- `ACCOUNT_LOCKED` (423): Account locked due to failed login attempts
- `TOKEN_EXPIRED` (401): JWT token has expired
- `INSUFFICIENT_PERMISSIONS` (403): User doesn't have required permissions

**Validation:**
- `VALIDATION_ERROR` (400): Request validation failed
- `INVALID_FILE_TYPE` (400): File type not allowed
- `FILE_TOO_LARGE` (400): File exceeds size limit
- `VALIDATION_FAILED` (400): File validation failed

**Resources:**
- `FILE_NOT_FOUND` (404): Requested file doesn't exist
- `USER_NOT_FOUND` (404): Requested user doesn't exist
- `LINK_EXPIRED` (403): File access link has expired
- `LINK_REVOKED` (403): File access has been revoked
- `LIMIT_EXCEEDED` (403): Download limit reached

**Rate Limiting:**
- `RATE_LIMIT_EXCEEDED` (429): Too many requests

**Server:**
- `UPLOAD_ERROR` (500): File upload failed
- `DOWNLOAD_ERROR` (500): File download failed
- `INTERNAL_ERROR` (500): Internal server error

---

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| File Upload | 10 requests | 15 minutes |
| File Download | 50 requests | 15 minutes |
| General API | 100 requests | 15 minutes |

Rate limit headers are included in responses:
```
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 1612620000
```

---

## Webhooks (Future Feature)

Coming soon: Webhook notifications for file events.

---

## SDK & Client Libraries (Future Feature)

Coming soon: Official client libraries for JavaScript, Python, and more.

---

**API Version:** 2.0.0  
**Last Updated:** 2024-02-06  
**Base URL:** https://api.secure-share-hub.com
