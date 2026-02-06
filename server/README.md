# Secure Share Hub - Backend Server

Backend API server for Secure Share Hub built with Node.js, Express, MongoDB, and TypeScript.

## Features

- User authentication with JWT tokens
- Secure file upload and download with access control
- File expiration and download limits
- Activity logging and tracking
- Admin dashboard with statistics
- Role-based access control (User/Admin)

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Security**: Helmet, bcryptjs, CORS
- **Validation**: express-validator

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher) running locally or MongoDB Atlas
- npm or yarn

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-share-hub
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173
```

5. Seed the database with initial admin user:
```bash
npm run seed
```

This creates an admin user:
- Email: `admin@example.com`
- Password: `Admin123!`

6. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout

### File Management (`/api/files`)

- `POST /api/files/upload` - Upload file (protected, multipart/form-data)
- `GET /api/files` - Get user's files (protected)
- `GET /api/files/:id` - Get file details (protected)
- `GET /api/files/access/:token` - Access file by token (public)
- `GET /api/files/download/:token` - Download file by token (public)
- `PATCH /api/files/:id/regenerate-token` - Regenerate token (protected)
- `PATCH /api/files/:id/revoke` - Revoke file (protected)
- `DELETE /api/files/:id` - Delete file (protected)

### Admin (`/api/admin`)

- `GET /api/admin/stats` - Get statistics (admin only)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/files` - Get all files (admin only)
- `GET /api/admin/activities` - Get all activities (admin only)
- `DELETE /api/admin/files/:id` - Delete any file (admin only)
- `PATCH /api/admin/users/:id/role` - Change user role (admin only)

### Activity (`/api/activities`)

- `GET /api/activities` - Get user's activities (protected)
- `GET /api/activities/:fileId` - Get file activities (protected)

## Database Schema

### User Model
- email (unique, required)
- password (hashed with bcrypt)
- name (required)
- role (enum: 'user', 'admin')
- createdAt (timestamp)

### File Model
- name (storage filename)
- originalName (user's filename)
- size (bytes)
- type (MIME type)
- path (file storage path)
- uploadedAt (timestamp)
- accessToken (unique, indexed)
- expiryTimestamp (date)
- maxDownloads (0 = unlimited)
- usedDownloads (counter)
- status (enum: 'active', 'revoked')
- visibility (enum: 'public', 'private')
- uploadedBy (reference to User)

### Activity Model
- fileId (reference to File)
- timestamp (date)
- eventType (enum: 'download_success', 'download_blocked', 'link_regenerated', 'link_revoked', 'access_attempt')
- status (enum: 'success', 'blocked', 'info')
- details (string)
- ipAddress (optional)
- userAgent (optional)

## Authentication Flow

1. User registers or logs in
2. Server returns JWT access token (24h expiry) and refresh token (7d expiry)
3. Client stores tokens (localStorage or cookies)
4. Client sends access token in Authorization header: `Bearer <token>`
5. Server validates token and attaches user to request
6. When access token expires, use refresh token to get new access token

## File Upload Process

1. User uploads file with optional parameters (maxDownloads, expiryHours, visibility)
2. Server validates file type and size
3. File stored in `uploads` directory with unique filename
4. Database record created with generated access token
5. Activity logged
6. Client receives file metadata and access token
7. Access token can be shared for downloads

## File Access Validation

When accessing a file by token:
1. Token exists and file found
2. File status is 'active' (not revoked)
3. File not expired (current time < expiryTimestamp)
4. Download limit not exceeded (if maxDownloads > 0)
5. If all checks pass, file is served
6. Download counter incremented
7. Activity logged

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable origin
- **bcrypt**: Password hashing with salt
- **JWT**: Stateless authentication
- **Input validation**: express-validator
- **File type whitelist**: Only allowed MIME types
- **File size limits**: Configurable max size (50MB default)
- **Rate limiting**: Ready for express-rate-limit integration
- **Error handling**: Consistent error responses

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/secure-share-hub |
| `JWT_SECRET` | JWT secret key | (required) |
| `JWT_REFRESH_SECRET` | Refresh token secret | (required) |
| `JWT_EXPIRE` | Access token expiry | 24h |
| `JWT_REFRESH_EXPIRE` | Refresh token expiry | 7d |
| `MAX_FILE_SIZE` | Max upload size in bytes | 52428800 (50MB) |
| `UPLOAD_DIR` | Upload directory path | ./uploads |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## Testing

Use tools like Postman, Insomnia, or curl to test endpoints.

Example - Register user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'
```

Example - Upload file:
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "maxDownloads=5" \
  -F "expiryHours=24" \
  -F "visibility=private"
```

## Error Handling

All API responses follow this format:

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Development

- Uses `nodemon` for auto-restart on file changes
- TypeScript compilation with `ts-node`
- Morgan logging in dev mode

## Production Deployment

1. Build TypeScript to JavaScript:
```bash
npm run build
```

2. Set production environment variables

3. Start the server:
```bash
npm start
```

4. Consider using PM2 or Docker for process management

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access if using MongoDB Atlas

### File Upload Error
- Check `MAX_FILE_SIZE` in `.env`
- Ensure `uploads` directory exists and is writable
- Verify file type is in whitelist

### JWT Token Error
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiry settings
- Verify token format: `Bearer <token>`

## License

MIT
