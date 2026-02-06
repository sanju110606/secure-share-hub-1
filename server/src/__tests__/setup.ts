// Test setup file
// This file is run before all tests
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | undefined;

// Setup before all tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Setup before each test
beforeEach(() => {
  jest.clearAllMocks();
});
