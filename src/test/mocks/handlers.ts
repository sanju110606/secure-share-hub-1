import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:5000/api';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auth/register`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      },
    });
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    // Validate credentials
    if (body.email === 'user@example.com' && body.password === 'User123!') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            userId: 'user-1',
            email: 'user@example.com',
            name: 'Alex Chen',
            role: 'user',
          },
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
      });
    }
    
    // Return error for invalid credentials
    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS',
        },
      },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/admin/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    
    // Validate admin credentials
    if (body.email === 'admin@example.com' && body.password === 'Admin123!') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            userId: 'admin-1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
          },
          accessToken: 'test-admin-token',
          refreshToken: 'test-admin-refresh-token',
        },
      });
    }
    
    // Return error for invalid credentials
    return HttpResponse.json(
      {
        success: false,
        error: {
          message: 'Invalid admin credentials',
          code: 'INVALID_CREDENTIALS',
        },
      },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/auth/logout`, async () => {
    return HttpResponse.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }),

  http.post(`${API_URL}/auth/refresh`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-test-access-token',
        refreshToken: 'new-test-refresh-token',
      },
    });
  }),

  // Files endpoints
  http.get(`${API_URL}/files`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        files: [],
      },
    });
  }),

  http.post(`${API_URL}/files/upload`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        file: {
          id: 'test-file-id',
          name: 'test-file.txt',
          originalName: 'test-file.txt',
          size: 1024,
          type: 'text/plain',
          accessToken: 'test-file-token',
          uploadedAt: new Date().toISOString(),
        },
      },
    });
  }),

  // Admin endpoints
  http.get(`${API_URL}/admin/stats`, async () => {
    return HttpResponse.json({
      success: true,
      data: {
        totalUsers: 10,
        totalFiles: 50,
        activeLinks: 30,
        recentActivity: [],
      },
    });
  }),
];
