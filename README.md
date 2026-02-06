# Secure Share Hub

[![CI/CD](https://github.com/vinay-2006/secure-share-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/vinay-2006/secure-share-hub/actions/workflows/ci.yml)
[![Security](https://github.com/vinay-2006/secure-share-hub/actions/workflows/security.yml/badge.svg)](https://github.com/vinay-2006/secure-share-hub/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready, full-stack secure file sharing application with end-to-end encryption, access control, activity tracking, and comprehensive security features.

## 🌟 Features

### 🔐 Security First
- **JWT-based Authentication** with access and refresh tokens
- **Password Strength Validation** (minimum 8 chars, uppercase, lowercase, numbers, special chars)
- **Account Lockout** after 5 failed login attempts (15-minute lockout)
- **Password Reset** with secure token-based system
- **Rate Limiting** on all endpoints (auth, upload, download)
- **File Validation**: MIME type, magic number, file size, extension matching
- **Filename Sanitization** to prevent path traversal attacks
- **Image Processing**: EXIF removal and optimization
- **Role-Based Access Control** (Admin/User)

### 📁 File Management
- **Secure File Upload** with comprehensive validation (50MB max)
- **Access Token Generation** for file sharing
- **Expiration Control** - Set automatic expiration times
- **Download Limits** - Control number of downloads
- **Access Revocation** - Revoke access anytime
- **File Preview** - View files before downloading
- **Supported Formats**: Documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX), Images (JPG, PNG, GIF, WEBP), Archives (ZIP, RAR, 7Z)

### 📊 Monitoring & Activity
- **Activity Tracking** - Monitor all file access and downloads
- **Admin Dashboard** - Comprehensive admin panel
- **Real-time Statistics** - File counts, storage usage, downloads
- **Audit Logging** - Track all sensitive operations
- **Health Check Endpoint** - Monitor application status

### 🎨 Modern UI/UX
- **Responsive Design** - Works on all devices
- **Beautiful Interface** - Built with React and Tailwind CSS
- **Smooth Animations** - Framer Motion animations
- **Toast Notifications** - User feedback with Sonner
- **Loading States** - Clear loading indicators

### 🚀 Production Ready
- **Docker Support** - Full containerization
- **CI/CD Pipelines** - Automated testing and deployment
- **Health Checks** - Application monitoring
- **Rate Limiting** - DDoS protection
- **Error Handling** - Comprehensive error management
- **Security Scanning** - CodeQL and dependency scanning
- **Comprehensive Tests** - 77+ backend tests, E2E tests

## Features

- 🔐 **Secure Authentication** - JWT-based authentication with role-based access control
- 📁 **File Sharing** - Upload and share files with unique access tokens
- ⏰ **Expiration Control** - Set automatic expiration times for shared files
- 📊 **Download Limits** - Control the number of times a file can be downloaded
- 🔒 **Access Revocation** - Revoke access to shared files at any time
- 📈 **Activity Tracking** - Monitor all file access and download activities
- 👥 **Admin Dashboard** - Comprehensive admin panel for managing users and files
- 🎨 **Modern UI** - Beautiful, responsive interface built with React and Tailwind CSS

## Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Client-side routing
- **Axios** - HTTP client with interceptors
- **Framer Motion** - Animations
- **Vitest** - Unit testing
- **Playwright** - E2E testing

### Backend
- **Node.js 18+** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer 2.0** - File upload handling
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **Sharp** - Image processing
- **Jest** - Unit testing

### DevOps & Infrastructure
- **Docker** - Containerization
- **GitHub Actions** - CI/CD pipelines
- **Nginx** - Reverse proxy & static serving
- **MongoDB Atlas** - Cloud database (optional)
- **Vercel** - Frontend deployment (optional)

## Project Structure

```
secure-share-hub/
├── src/                      # Frontend source code
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── lib/                # Contexts and utilities
│   ├── services/           # API service layer
│   └── App.tsx             # Main app component
├── server/                  # Backend source code
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # MongoDB models
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── uploads/            # File storage directory
│   └── package.json
└── package.json            # Root package.json
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher) - Running locally or MongoDB Atlas
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd secure-share-hub
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd server
npm install
cd ..
```

4. **Set up environment variables**

Create `.env` in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
```

Create `server/.env`:
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

5. **Seed the database with initial admin user**
```bash
cd server
npm run seed
cd ..
```

This creates an admin user:
- Email: `admin@example.com`
- Password: `Admin123!`

### Running the Application

**Option 1: Run both client and server together**
```bash
npm run dev:full
```

**Option 2: Run separately**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
npm run dev:server
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## Default Credentials

After seeding the database:
- **Admin**: admin@example.com / Admin123!

You can register new users through the application.

## API Endpoints

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Main Endpoints

**Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login  
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/password/reset-request` - Request password reset
- `POST /api/auth/password/reset` - Reset password with token
- `GET /api/auth/me` - Get current user

**Files**
- `POST /api/files/upload` - Upload file (rate limited: 10/15min)
- `GET /api/files` - Get user's files
- `GET /api/files/:id` - Get file by ID
- `GET /api/files/access/:token` - Validate and get file metadata
- `GET /api/files/download/:token` - Download file (rate limited: 50/15min)
- `PATCH /api/files/:id/regenerate-token` - Generate new access token
- `PATCH /api/files/:id/revoke` - Revoke file access
- `DELETE /api/files/:id` - Delete file

**Admin**
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/files` - Get all files
- `DELETE /api/admin/users/:id` - Delete user

**Health**
- `GET /api/health` - Health check endpoint

## Development

### Available Scripts

**Root directory:**
- `npm run dev` - Start frontend dev server
- `npm run dev:server` - Start backend dev server
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend for production
- `npm run build:full` - Build both frontend and backend
- `npm run lint` - Run ESLint
- `npm run test` - Run frontend tests
- `npm run test:watch` - Run frontend tests in watch mode
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with UI

**Server directory:**
- `npm run dev` - Start backend in development mode
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with admin user
- `npm test` - Run backend tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Testing

The project includes comprehensive test coverage:

**Backend Tests (Jest)**
```bash
cd server
npm test
```
- 77+ unit tests
- File validation tests
- Authentication tests (password strength, lockout, reset)
- Controller tests
- Middleware tests

**Frontend Tests (Vitest)**
```bash
npm test
```
- Component tests
- Hook tests
- Integration tests

**E2E Tests (Playwright)**
```bash
npm run test:e2e
```
- User registration and login flows
- File upload and download flows
- Admin panel operations

### Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint -- --fix

# Run security audit
npm audit

# Check for outdated packages
npm outdated
```

## Docker Deployment

### Quick Start with Docker Compose
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Build Docker Images
```bash
# Build frontend
docker build -t secure-share-hub-frontend .

# Build backend
docker build -t secure-share-hub-backend ./server
```

## Documentation

- **[API Documentation](./API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[Authentication Features](./server/AUTHENTICATION_FEATURES.md)** - Auth system documentation
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- **[Security Policy](./SECURITY.md)** - Security features and reporting

## CI/CD Pipelines

The project includes automated GitHub Actions workflows:

- **CI Pipeline** (`ci.yml`):
  - Frontend tests and build
  - Backend tests and build
  - Code quality checks
  - Coverage reports

- **Security Pipeline** (`security.yml`):
  - CodeQL security analysis
  - Dependency scanning
  - NPM audit

- **CD Pipelines**:
  - Frontend deployment to Vercel (`cd-frontend.yml`)
  - Backend deployment (`cd-backend.yml`)

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (server/.env)
See [Deployment Guide](./DEPLOYMENT_GUIDE.md) for complete configuration.

## Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens (24h access, 7d refresh)
- Password strength validation (8+ chars, uppercase, lowercase, number, special char)
- Account lockout after 5 failed attempts (15-minute lockout)
- Secure password reset with time-limited tokens (1-hour expiry)
- Role-based access control (Admin/User)

### File Upload Security
- MIME type validation
- Magic number (file signature) validation
- File extension validation
- Extension-MIME type matching
- Filename sanitization (prevents path traversal)
- File size limits (50MB)
- Image EXIF data removal
- Supported file types whitelist

### API Security
- Rate limiting on all sensitive endpoints
- Helmet.js security headers
- CORS configuration
- Input validation and sanitization
- Error handling without information leakage
- Activity logging for audit trails

### Infrastructure Security
- Environment-based configuration
- Secrets in environment variables
- Docker security best practices
- Health check endpoints
- Automated security scanning (CodeQL, npm audit)

See [SECURITY.md](./SECURITY.md) for security policy and reporting vulnerabilities.

## Performance & Optimization

- Image optimization and compression
- Code splitting (frontend)
- Gzip compression
- Efficient database queries
- Connection pooling
- Caching headers
- Docker multi-stage builds

## Monitoring & Logging

- Structured activity logging
- File access tracking
- Authentication attempt logging
- Error logging
- Health check endpoint
- Admin statistics dashboard

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Open an issue on GitHub
- Check the [server README](./server/README.md) for backend-specific documentation
- Review the API documentation

## Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)
