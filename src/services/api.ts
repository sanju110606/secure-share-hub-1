/**
 * Mock API Implementation using localStorage
 * This replaces the axios-based API calls with localStorage operations
 * for a fully standalone frontend-only application
 */

// ============================================================================
// TYPES
// ============================================================================

interface User {
  userId: string;
  email: string;
  password: string; // stored in plain text for demo (in production would be hashed)
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  accessToken: string;
  expiryTimestamp: string;
  maxDownloads: number;
  usedDownloads: number;
  status: 'active' | 'revoked';
  visibility: 'public' | 'private';
  uploadedBy: string;
  uploadedByName: string;
  fileData: string; // base64 encoded file data
}

interface Activity {
  id: string;
  fileId: string;
  userId: string;
  timestamp: string;
  eventType: 'download_success' | 'download_blocked' | 'link_regenerated' | 'link_revoked' | 'access_attempt';
  status: 'success' | 'blocked' | 'info';
  details: string;
}

// ============================================================================
// LOCALSTORAGE HELPERS
// ============================================================================

const STORAGE_KEYS = {
  USERS: 'vaultdrop_users',
  FILES: 'vaultdrop_files',
  ACTIVITIES: 'vaultdrop_activities',
  INITIALIZED: 'vaultdrop_initialized',
};

function getUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
}

function setUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

function getFiles(): StoredFile[] {
  const data = localStorage.getItem(STORAGE_KEYS.FILES);
  return data ? JSON.parse(data) : [];
}

function setFiles(files: StoredFile[]): void {
  localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
}

function getActivities(): Activity[] {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
  return data ? JSON.parse(data) : [];
}

function setActivities(activities: Activity[]): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
}

function getCurrentUser(): User | null {
  const userData = localStorage.getItem('auth_user');
  if (!userData) return null;
  
  try {
    const user = JSON.parse(userData);
    // Find full user data from storage
    const users = getUsers();
    return users.find(u => u.userId === user.userId) || null;
  } catch {
    return null;
  }
}

// ============================================================================
// INITIALIZATION - Seed demo users on first load
// ============================================================================

function initializeApp(): void {
  if (localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    return; // Already initialized
  }

  // Seed demo users
  const demoUsers: User[] = [
    {
      userId: 'user-demo-001',
      email: 'user@example.com',
      password: 'User123!', // Plain text for demo
      name: 'Demo User',
      role: 'user',
      createdAt: new Date().toISOString(),
    },
    {
      userId: 'user-admin-001',
      email: 'admin@example.com',
      password: 'Admin123!', // Plain text for demo
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  ];

  setUsers(demoUsers);
  setFiles([]);
  setActivities([]);
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
}

// Initialize on module load
initializeApp();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateToken(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function generateJWT(): string {
  // Generate a fake JWT-like token
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    userId: getCurrentUser()?.userId || 'unknown',
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  }));
  const signature = generateToken().substring(0, 43);
  return `${header}.${payload}.${signature}`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const contentType = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const byteString = atob(parts[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: contentType });
}

function logActivity(activity: Omit<Activity, 'id' | 'timestamp' | 'userId'>): void {
  const currentUser = getCurrentUser();
  const activities = getActivities();
  
  const newActivity: Activity = {
    id: crypto.randomUUID(),
    userId: currentUser?.userId || 'anonymous',
    timestamp: new Date().toISOString(),
    ...activity,
  };
  
  activities.unshift(newActivity);
  setActivities(activities);
}

// ============================================================================
// AUTH API
// ============================================================================

export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    const users = getUsers();
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return {
        success: false,
        error: {
          message: 'User with this email already exists',
          code: 'USER_EXISTS',
        },
      };
    }

    // Validate password strength (matching backend requirements)
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/])(?!.*\s)[A-Za-z\d@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return {
        success: false,
        error: {
          message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character',
          code: 'WEAK_PASSWORD',
          details: [{ msg: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character' }],
        },
      };
    }

    const newUser: User = {
      userId: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      password, // Plain text for demo
      name,
      role: 'user',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setUsers(users);

    return {
      success: true,
      data: {
        message: 'Registration successful',
      },
    };
  },

  login: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return {
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
      };
    }

    const accessToken = generateJWT();
    const refreshToken = generateJWT();

    return {
      success: true,
      data: {
        user: {
          userId: user.userId,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      },
    };
  },

  adminLogin: async (email: string, password: string) => {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return {
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
      };
    }

    if (user.role !== 'admin') {
      return {
        success: false,
        error: {
          message: 'Unauthorized - Admin access required',
          code: 'UNAUTHORIZED',
        },
      };
    }

    const accessToken = generateJWT();
    const refreshToken = generateJWT();

    return {
      success: true,
      data: {
        user: {
          userId: user.userId,
          role: user.role,
          name: user.name,
          email: user.email,
        },
        accessToken,
        refreshToken,
      },
    };
  },

  getCurrentUser: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const user = getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: {
          message: 'Not authenticated',
          code: 'NOT_AUTHENTICATED',
        },
      };
    }

    return {
      success: true,
      data: {
        user: {
          userId: user.userId,
          role: user.role,
          name: user.name,
          email: user.email,
        },
      },
    };
  },

  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    };
  },
};

// ============================================================================
// FILE API
// ============================================================================

export const fileAPI = {
  uploadFile: async (file: File, maxDownloads: number, expiryHours: number, visibility: string) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate upload delay

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    // Convert file to base64
    const fileData = await fileToBase64(file);

    const newFile: StoredFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      accessToken: generateToken(),
      expiryTimestamp: new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString(),
      maxDownloads,
      usedDownloads: 0,
      status: 'active',
      visibility: visibility as 'public' | 'private',
      uploadedBy: currentUser.userId,
      uploadedByName: currentUser.name,
      fileData,
    };

    const files = getFiles();
    files.push(newFile);
    setFiles(files);

    // Log activity
    logActivity({
      fileId: newFile.id,
      eventType: 'access_attempt',
      status: 'success',
      details: `File "${file.name}" uploaded successfully`,
    });

    return {
      success: true,
      data: {
        file: {
          id: newFile.id,
          name: newFile.name,
          size: newFile.size,
          type: newFile.type,
          uploadedAt: newFile.uploadedAt,
          accessToken: newFile.accessToken,
          expiryTimestamp: newFile.expiryTimestamp,
          maxDownloads: newFile.maxDownloads,
          usedDownloads: newFile.usedDownloads,
          status: newFile.status,
          visibility: newFile.visibility,
          uploadedBy: newFile.uploadedBy,
          uploadedByName: newFile.uploadedByName,
        },
      },
    };
  },

  getUserFiles: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const files = getFiles();
    const userFiles = files
      .filter(f => f.uploadedBy === currentUser.userId)
      .map(({ fileData, ...file }) => file); // Exclude fileData from response

    return {
      success: true,
      data: {
        files: userFiles,
      },
    };
  },

  getFileById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 100));

    const files = getFiles();
    const file = files.find(f => f.id === id);

    if (!file) {
      return {
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      };
    }

    const { fileData, ...fileWithoutData } = file;

    return {
      success: true,
      data: {
        file: fileWithoutData,
      },
    };
  },

  accessFileByToken: async (token: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const files = getFiles();
    const file = files.find(f => f.accessToken === token);

    if (!file) {
      return {
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      };
    }

    const { fileData, ...fileWithoutData } = file;

    return {
      success: true,
      data: {
        file: fileWithoutData,
      },
    };
  },

  downloadFileByToken: async (token: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const files = getFiles();
    const file = files.find(f => f.accessToken === token);

    if (!file) {
      throw new Error('File not found');
    }

    // Validate access
    if (file.status === 'revoked') {
      logActivity({
        fileId: file.id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked - Link revoked',
      });
      throw new Error('This link has been revoked');
    }

    if (new Date(file.expiryTimestamp).getTime() < Date.now()) {
      logActivity({
        fileId: file.id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked - Token expired',
      });
      throw new Error('This link has expired');
    }

    if (file.maxDownloads > 0 && file.usedDownloads >= file.maxDownloads) {
      logActivity({
        fileId: file.id,
        eventType: 'download_blocked',
        status: 'blocked',
        details: 'Download blocked - Download limit reached',
      });
      throw new Error('Download limit reached');
    }

    // Increment download count
    file.usedDownloads += 1;
    setFiles(files);

    // Log successful download
    logActivity({
      fileId: file.id,
      eventType: 'download_success',
      status: 'success',
      details: 'File downloaded successfully',
    });

    // Convert base64 to blob
    const blob = base64ToBlob(file.fileData);

    // Return axios-like response
    return {
      data: blob,
      headers: {
        'content-type': file.type,
        'content-disposition': `attachment; filename="${file.name}"`,
      },
    };
  },

  regenerateToken: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === id);

    if (fileIndex === -1) {
      return {
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      };
    }

    const file = files[fileIndex];

    // Check authorization
    if (file.uploadedBy !== currentUser.userId && currentUser.role !== 'admin') {
      return {
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      };
    }

    // Generate new token and reset
    file.accessToken = generateToken();
    file.status = 'active';
    file.usedDownloads = 0;
    
    setFiles(files);

    // Log activity
    logActivity({
      fileId: file.id,
      eventType: 'link_regenerated',
      status: 'info',
      details: 'Share link regenerated',
    });

    const { fileData, ...fileWithoutData } = file;

    return {
      success: true,
      data: {
        file: fileWithoutData,
      },
    };
  },

  revokeFile: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === id);

    if (fileIndex === -1) {
      return {
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      };
    }

    const file = files[fileIndex];

    // Check authorization
    if (file.uploadedBy !== currentUser.userId && currentUser.role !== 'admin') {
      return {
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      };
    }

    file.status = 'revoked';
    setFiles(files);

    // Log activity
    logActivity({
      fileId: file.id,
      eventType: 'link_revoked',
      status: 'info',
      details: 'Share link revoked',
    });

    return {
      success: true,
      data: {
        message: 'File revoked successfully',
      },
    };
  },

  deleteFile: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === id);

    if (fileIndex === -1) {
      return {
        success: false,
        error: {
          message: 'File not found',
          code: 'FILE_NOT_FOUND',
        },
      };
    }

    const file = files[fileIndex];

    // Check authorization
    if (file.uploadedBy !== currentUser.userId && currentUser.role !== 'admin') {
      return {
        success: false,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      };
    }

    files.splice(fileIndex, 1);
    setFiles(files);

    // Remove related activities
    const activities = getActivities();
    const filteredActivities = activities.filter(a => a.fileId !== id);
    setActivities(filteredActivities);

    return {
      success: true,
      data: {
        message: 'File deleted successfully',
      },
    };
  },
};

// ============================================================================
// ADMIN API
// ============================================================================

export const adminAPI = {
  getStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const users = getUsers();
    const files = getFiles();
    const activities = getActivities();

    const stats = {
      totalUsers: users.length,
      totalFiles: files.length,
      activeLinks: files.filter(f => f.status === 'active' && new Date(f.expiryTimestamp) > new Date()).length,
      expiredLinks: files.filter(f => new Date(f.expiryTimestamp) <= new Date()).length,
      totalDownloads: files.reduce((sum, f) => sum + f.usedDownloads, 0),
      blockedAttempts: activities.filter(a => a.eventType === 'download_blocked').length,
    };

    return {
      success: true,
      data: {
        stats,
      },
    };
  },

  getAllUsers: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const users = getUsers();
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return {
      success: true,
      data: {
        users: usersWithoutPasswords,
      },
    };
  },

  getAllFiles: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const files = getFiles();
    const filesWithoutData = files.map(({ fileData, ...file }) => file);

    return {
      success: true,
      data: {
        files: filesWithoutData,
      },
    };
  },

  getAllActivities: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const activities = getActivities();

    return {
      success: true,
      data: {
        activities,
      },
    };
  },

  deleteFile: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    // Use the fileAPI deleteFile method
    return fileAPI.deleteFile(id);
  },

  changeUserRole: async (id: string, role: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const users = getUsers();
    const userIndex = users.findIndex(u => u.userId === id);

    if (userIndex === -1) {
      return {
        success: false,
        error: {
          message: 'User not found',
          code: 'USER_NOT_FOUND',
        },
      };
    }

    users[userIndex].role = role as 'user' | 'admin';
    setUsers(users);

    return {
      success: true,
      data: {
        user: {
          userId: users[userIndex].userId,
          email: users[userIndex].email,
          name: users[userIndex].name,
          role: users[userIndex].role,
        },
      },
    };
  },
};

// ============================================================================
// ACTIVITY API
// ============================================================================

export const activityAPI = {
  getUserActivities: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const activities = getActivities();
    const files = getFiles();

    // Get activities for files uploaded by current user
    const userFileIds = files
      .filter(f => f.uploadedBy === currentUser.userId)
      .map(f => f.id);

    const userActivities = activities.filter(a => 
      userFileIds.includes(a.fileId) || a.userId === currentUser.userId
    );

    return {
      success: true,
      data: {
        activities: userActivities,
      },
    };
  },

  getFileActivities: async (fileId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const activities = getActivities();
    const fileActivities = activities.filter(a => a.fileId === fileId);

    return {
      success: true,
      data: {
        activities: fileActivities,
      },
    };
  },
};

// Legacy export for compatibility
export default {
  authAPI,
  fileAPI,
  adminAPI,
  activityAPI,
};
