# Enhanced Authentication Features

This document describes the enhanced authentication features implemented in the Secure Share Hub backend.

## Overview

Three major authentication enhancements have been added:
1. **Password Strength Validation** - Enforces strong password requirements
2. **Account Lockout** - Protects against brute force attacks
3. **Password Reset Token System** - Secure password recovery mechanism

---

## 1. Password Strength Validation

### Requirements
Passwords must meet the following criteria:
- Minimum 8 characters in length
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (@$!%*?&#^()_+-=[]{};\:'"|,.<>/)
- No spaces allowed

### Implementation Details

**Validator Function**: `isStrongPassword()` in `src/utils/validators.ts`
```typescript
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])(?!.*\s)[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]{8,}$/;
```

**Applied To**:
- User registration endpoint: `POST /api/auth/register`
- Password reset endpoint: `POST /api/auth/password/reset`

**Error Response**:
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [{
      "msg": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    }]
  }
}
```

### Examples

**Valid Passwords**:
- `SecurePass123!`
- `MyP@ssw0rd`
- `Admin#2024$`

**Invalid Passwords**:
- `password` (no uppercase, number, or special char)
- `PASSWORD123` (no lowercase or special char)
- `Pass123` (too short)
- `Pass 123!` (contains space)

---

## 2. Account Lockout Mechanism

### Features
- Tracks failed login attempts per user account
- Locks account after 5 consecutive failed attempts
- Lockout duration: 15 minutes
- Failed attempts reset on successful login
- Lock automatically expires after timeout period

### Implementation Details

**User Model Fields** (`src/models/User.ts`):
```typescript
failedLoginAttempts: number;  // Default: 0
lockUntil?: Date;              // Lock expiry timestamp
```

**User Model Methods**:
```typescript
isLocked(): boolean
incrementFailedAttempts(): Promise<void>
resetFailedAttempts(): Promise<void>
```

**Applied To**:
- Regular user login: `POST /api/auth/login`
- Admin login: `POST /api/auth/admin/login`

### Login Flow

1. User submits credentials
2. Check if account is currently locked
3. If locked, return 423 status with lock information
4. Verify password
5. If password incorrect:
   - Increment failed attempts
   - If attempts >= 5, lock account for 15 minutes
   - Return remaining attempts in error response
6. If password correct:
   - Reset failed attempts counter
   - Generate and return tokens

### Error Responses

**Account Locked**:
```json
{
  "success": false,
  "error": {
    "message": "Account is temporarily locked due to too many failed login attempts. Please try again later.",
    "code": "ACCOUNT_LOCKED",
    "lockUntil": "2024-02-06T22:15:00.000Z"
  }
}
```
HTTP Status: `423 Locked`

**Failed Login with Remaining Attempts**:
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS",
    "remainingAttempts": 3
  }
}
```
HTTP Status: `401 Unauthorized`

### Constants
- `MAX_ATTEMPTS`: 5 failed attempts before lockout
- `LOCK_TIME`: 15 minutes (900,000 milliseconds)

### Edge Cases Handled
- Expired locks automatically reset on next login attempt
- Lock counter resets if lock has expired
- Password reset clears any existing lockout state

---

## 3. Password Reset Token System

### Features
- Secure token-based password reset
- Tokens expire after 1 hour
- Tokens are SHA-256 hashed before storage
- One-time use tokens (cleared after successful reset)
- Resets any account lockout state
- Returns generic success message for security (prevents user enumeration)

### Implementation Details

**User Model Fields** (`src/models/User.ts`):
```typescript
resetPasswordToken?: string;    // SHA-256 hashed token
resetPasswordExpiry?: Date;      // Token expiry timestamp
```

### Endpoints

#### 1. Request Password Reset

**Endpoint**: `POST /api/auth/password/reset-request`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "If an account with that email exists, a password reset link has been sent.",
    "resetToken": "abc123..." // NOTE: Only for testing, remove in production
  }
}
```

**Implementation Notes**:
- Always returns success even if email doesn't exist (prevents user enumeration)
- Generates 32-byte random token
- Stores SHA-256 hash of token in database
- Sets expiry to current time + 1 hour
- In production, token should be sent via email, not in response

#### 2. Reset Password

**Endpoint**: `POST /api/auth/password/reset`

**Request Body**:
```json
{
  "token": "abc123...",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully"
  }
}
```

**Error Response - Invalid/Expired Token** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "message": "Invalid or expired reset token",
    "code": "INVALID_RESET_TOKEN"
  }
}
```

**Implementation Notes**:
- Validates token hasn't expired
- Hashes provided token and compares with stored hash
- Updates password (triggers bcrypt hashing)
- Clears reset token and expiry
- Resets failed login attempts and lockout state
- Token cannot be reused (cleared after successful reset)

### Security Considerations

1. **Token Generation**: Uses `crypto.randomBytes(32)` for cryptographically secure random tokens
2. **Token Storage**: Tokens are hashed with SHA-256 before storage
3. **Token Expiry**: Strict 1-hour expiration enforced at database query level
4. **User Enumeration Prevention**: Returns generic success message regardless of email existence
5. **One-Time Use**: Tokens are cleared immediately after use
6. **Password Validation**: New password must meet strength requirements

### Token Lifecycle

```
1. User requests reset
   ↓
2. Generate random token (32 bytes)
   ↓
3. Hash token with SHA-256
   ↓
4. Store hash + expiry in database
   ↓
5. Send token to user (via email in production)
   ↓
6. User submits token + new password
   ↓
7. Hash submitted token
   ↓
8. Query database for matching hash + valid expiry
   ↓
9. Update password, clear token + expiry
   ↓
10. Reset lockout state
```

### Constants
- `TOKEN_LENGTH`: 32 bytes (256 bits)
- `TOKEN_EXPIRY`: 1 hour (3,600,000 milliseconds)

---

## Testing

### Test Coverage

**Unit Tests** (`src/__tests__/unit/auth.test.ts`):
- Password strength validation (16 tests)
- Account lockout mechanism (8 tests)
- Password reset token system (10 tests)
- Integration scenarios (2 tests)

**Integration Tests** (`src/__tests__/integration/auth.integration.test.ts`):
- Registration with password validation (4 tests)
- Login with account lockout (7 tests)
- Admin login with account lockout (2 tests)
- Password reset request (5 tests)
- Password reset execution (7 tests)

**Validator Tests** (`src/__tests__/unit/validators.test.ts`):
- Password strength regex validation (16 tests)

**Total Test Cases**: 77 tests

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --testNamePattern="Password Strength"
npm test -- --testNamePattern="Account Lockout"
npm test -- --testNamePattern="Password Reset"

# Run with coverage
npm test -- --coverage
```

### Test Examples

```typescript
// Password strength validation
expect(isStrongPassword('StrongPass123!')).toBe(true);
expect(isStrongPassword('weak')).toBe(false);

// Account lockout
for (let i = 0; i < 5; i++) {
  await user.incrementFailedAttempts();
}
expect(user.isLocked()).toBe(true);

// Password reset
const token = crypto.randomBytes(32).toString('hex');
user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
user.resetPasswordExpiry = new Date(Date.now() + 3600000);
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user with strong password | No |
| POST | `/api/auth/login` | Login with lockout protection | No |
| POST | `/api/auth/admin/login` | Admin login with lockout protection | No |
| POST | `/api/auth/password/reset-request` | Request password reset token | No |
| POST | `/api/auth/password/reset` | Reset password with token | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |
| POST | `/api/auth/logout` | Logout (client-side) | No |

---

## Database Schema Changes

### User Model

**New Fields**:
```typescript
failedLoginAttempts: {
  type: Number,
  default: 0
}

lockUntil: {
  type: Date,
  optional: true
}

resetPasswordToken: {
  type: String,
  optional: true
}

resetPasswordExpiry: {
  type: Date,
  optional: true
}
```

**New Methods**:
```typescript
isLocked(): boolean
incrementFailedAttempts(): Promise<void>
resetFailedAttempts(): Promise<void>
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INVALID_CREDENTIALS` | 401 | Email or password incorrect |
| `ACCOUNT_LOCKED` | 423 | Account temporarily locked |
| `INVALID_RESET_TOKEN` | 400 | Reset token invalid or expired |
| `PASSWORD_RESET_REQUEST_ERROR` | 500 | Server error during reset request |
| `PASSWORD_RESET_ERROR` | 500 | Server error during password reset |

---

## Security Best Practices

### Password Storage
- Passwords hashed with bcrypt (cost factor: 10)
- Reset tokens hashed with SHA-256
- No plaintext passwords stored

### Rate Limiting
- All auth endpoints protected by rate limiter
- Prevents rapid-fire brute force attempts

### Token Security
- Cryptographically secure random generation
- One-time use enforcement
- Strict expiration validation
- No token reuse possible

### User Enumeration Prevention
- Generic error messages for password resets
- Consistent response times
- No indication if email exists

### Account Protection
- Automatic lockout after failed attempts
- Time-based lock expiration
- Lock state persisted across restarts

---

## Migration Guide

### For Existing Users
1. Existing users are not affected by password strength requirements
2. Password strength is only enforced on:
   - New user registration
   - Password reset
3. Existing users maintain their current passwords

### Database Migration
No manual migration required. New fields have default values:
- `failedLoginAttempts`: Defaults to 0
- `lockUntil`: Undefined (not locked)
- `resetPasswordToken`: Undefined
- `resetPasswordExpiry`: Undefined

---

## Future Enhancements

The following features are planned for future releases:
- Email verification system
- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub)
- Session management and token blacklisting
- Login history and audit logs
- Suspicious activity detection
- Password change enforcement policies

---

## Configuration

### Environment Variables
No new environment variables required. Uses existing JWT configuration:
- `JWT_SECRET`: For access tokens
- `JWT_REFRESH_SECRET`: For refresh tokens

### Customizable Constants
Located in `src/models/User.ts` and `src/controllers/auth.controller.ts`:

```typescript
// Account lockout
const MAX_ATTEMPTS = 5;           // Maximum failed login attempts
const LOCK_TIME = 15 * 60 * 1000; // Lockout duration (15 minutes)

// Password reset
const TOKEN_LENGTH = 32;           // Reset token length (bytes)
const TOKEN_EXPIRY = 60 * 60 * 1000; // Token expiry (1 hour)
```

---

## Troubleshooting

### Common Issues

**Issue**: User account locked after password reset
**Solution**: Password reset automatically clears lockout state. Ensure `failedLoginAttempts` is set to 0 and `lockUntil` is undefined.

**Issue**: Reset token always shows as invalid
**Solution**: Ensure token is being hashed before storage and before comparison. Both operations must use SHA-256.

**Issue**: Lock doesn't expire after 15 minutes
**Solution**: Check system time. Lock expiry uses `Date.now()` and compares with `lockUntil` timestamp.

**Issue**: Password validation fails for valid password
**Solution**: Verify password meets all requirements including no spaces. Check regex pattern in validators.

---

## References

- User Model: `server/src/models/User.ts`
- Auth Controller: `server/src/controllers/auth.controller.ts`
- Validators: `server/src/utils/validators.ts`
- Auth Routes: `server/src/routes/auth.routes.ts`
- Unit Tests: `server/src/__tests__/unit/auth.test.ts`
- Integration Tests: `server/src/__tests__/integration/auth.integration.test.ts`
