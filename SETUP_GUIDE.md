# Setup Guide - Secure Share Hub

This guide will help you get the Secure Share Hub application up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download](https://git-scm.com/)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vinay-2006/secure-share-hub.git
cd secure-share-hub
```

### 2. Install Dependencies

#### Install Frontend Dependencies
```bash
npm install
```

#### Install Backend Dependencies
```bash
cd server
npm install
cd ..
```

### 3. Set Up MongoDB

#### Option A: Local MongoDB

1. **Install MongoDB** following the [official guide](https://docs.mongodb.com/manual/installation/)

2. **Start MongoDB**:
   - **macOS/Linux**: `sudo systemctl start mongod` or `brew services start mongodb-community`
   - **Windows**: MongoDB should start automatically as a service

3. **Verify MongoDB is running**:
   ```bash
   mongosh
   # You should see MongoDB shell connecting successfully
   ```

#### Option B: MongoDB Atlas (Cloud)

1. **Create a free account** at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. **Create a cluster** (choose the free tier)

3. **Get your connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### 4. Configure Environment Variables

#### Frontend Configuration

1. Create `.env` in the root directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

#### Backend Configuration

1. Create `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```

2. Edit `server/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   
   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/secure-share-hub
   
   # For MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secure-share-hub?retryWrites=true&w=majority
   
   # Generate secure random strings for production:
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_REFRESH_SECRET=your-refresh-token-secret
   
   JWT_EXPIRE=24h
   JWT_REFRESH_EXPIRE=7d
   MAX_FILE_SIZE=52428800
   UPLOAD_DIR=./uploads
   CORS_ORIGIN=http://localhost:5173
   ```

   **⚠️ Important**: For production, generate secure random strings:
   ```bash
   # Generate secure secrets (Node.js)
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

### 5. Seed the Database

This creates the initial admin user in the database:

```bash
cd server
npm run seed
cd ..
```

**Output should show:**
```
MongoDB connected
✓ Admin user created successfully
  Email: admin@example.com
  Password: Admin123!
✓ Demo user created successfully
  Email: user@example.com
  Password: User123!

✓ Seed completed: 2 user(s) created
```

**Note**: The password policy requires at least 8 characters with uppercase, lowercase, number, and special character.

### 6. Run the Application

#### Option A: Run Both Frontend and Backend Together (Recommended)

```bash
npm run dev:full
```

#### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 7. Access the Application

- **Frontend**: Open your browser to [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 8. Login

#### Admin Login
1. Go to [http://localhost:5173/login/admin](http://localhost:5173/login/admin)
2. Use credentials:
   - Email: `admin@example.com`
   - Password: `Admin123!`

#### Demo User Login
1. Go to [http://localhost:5173/login](http://localhost:5173/login)
2. Use credentials:
   - Email: `user@example.com`
   - Password: `User123!`

#### User Registration
1. Go to [http://localhost:5173/login](http://localhost:5173/login)
2. Click "Register" and create a new user account
3. **Important**: Password must be at least 8 characters and include:
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number
   - At least one special character (@$!%*?&#, etc.)
   - No spaces

## Testing the Features

### 1. Upload a File (as User)
1. Login as a regular user
2. Click on the file upload area
3. Select a file
4. Click "Upload & Share"
5. You'll see the file in your dashboard with an access token

### 2. Share a File
1. Click on a file in your dashboard
2. Copy the access token or share link
3. Anyone with the token can access the file

### 3. Download a File
1. Navigate to `/file/:token` in the browser
2. Or use the "File Access" page
3. Enter the access token
4. Download the file

### 4. Admin Dashboard (as Admin)
1. Login as admin
2. Go to `/admin`
3. View statistics:
   - Total users
   - Total files
   - Active/expired links
   - Download statistics
4. Manage all files
5. View activity logs

### 5. Activity Tracking
1. Go to `/activity`
2. View all activity for your files:
   - Upload events
   - Download attempts
   - Token regenerations
   - Link revocations

## Troubleshooting

### MongoDB Connection Error

**Problem**: `MongoDB connection error`

**Solution**:
- Verify MongoDB is running: `mongosh`
- Check the connection string in `server/.env`
- For Atlas, ensure IP address is whitelisted
- Check firewall settings

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Find process using port 5000
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change the port in server/.env
PORT=5001
```

### File Upload Error

**Problem**: File upload fails or returns error

**Solution**:
- Check `server/uploads` directory exists and is writable
- Verify `MAX_FILE_SIZE` in `server/.env`
- Check file type is in the whitelist (`server/src/middleware/upload.ts`)

### JWT Token Error

**Problem**: `Invalid or expired token`

**Solution**:
- Clear browser localStorage
- Logout and login again
- Check `JWT_SECRET` is set in `server/.env`
- Verify token expiration settings

### Build Errors

**Problem**: TypeScript or build errors

**Solution**:
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Server
cd server
rm -rf node_modules package-lock.json
npm install
cd ..
```

## Development Tips

### Useful Commands

```bash
# Build frontend for production
npm run build

# Build backend for production
npm run build:server

# Lint code
npm run lint

# Run tests
npm run test

# Clean build
rm -rf dist server/dist
```

### Database Management

```bash
# Connect to MongoDB shell
mongosh

# List databases
show dbs

# Use database
use secure-share-hub

# View collections
show collections

# View users
db.users.find()

# View files
db.files.find()

# View activities
db.activities.find()

# Drop database (careful!)
db.dropDatabase()
```

### API Testing

Use tools like:
- **Postman** - [Download](https://www.postman.com/downloads/)
- **Insomnia** - [Download](https://insomnia.rest/download)
- **curl** - Command line

Example curl request:
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Upload file (replace TOKEN with actual JWT)
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "maxDownloads=5" \
  -F "expiryHours=24" \
  -F "visibility=private"
```

## Production Deployment

For production deployment:

1. **Use environment variables** from a secure source (not .env files)
2. **Use strong JWT secrets** (64+ characters random)
3. **Enable HTTPS** for both frontend and backend
4. **Use MongoDB Atlas** or managed MongoDB service
5. **Set up monitoring** (logs, errors, metrics)
6. **Configure rate limiting** to prevent abuse
7. **Regular backups** of MongoDB database
8. **Update dependencies** regularly for security patches

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/vinay-2006/secure-share-hub/issues)
- **API Documentation**: [server/README.md](./server/README.md)
- **Main README**: [README.md](./README.md)

## Next Steps

1. ✅ Complete local setup
2. 🎯 Test all features
3. 🔧 Customize for your needs
4. 🚀 Deploy to production
5. 📊 Monitor and maintain

Enjoy using Secure Share Hub! 🎉
