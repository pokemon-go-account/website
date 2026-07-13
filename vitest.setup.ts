import { vi } from 'vitest';
import path from 'path';
import fs from 'fs';

// Load .env.local
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) {
      let [, key, value] = match;
      key = key.trim();
      value = value.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
}

// Ensure test database is used
if (process.env.MONGODB_URI) {
  process.env.MONGODB_URI = process.env.MONGODB_URI.replace(/\/pokemon-auction-mvp(\?|$)/, "/pokemon-auction-test$1");
} else {
  process.env.MONGODB_URI = "mongodb://localhost:27017/pokemon-auction-test";
}

// Mock Next.js caching
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Next.js headers/cookies
vi.mock('next/headers', () => {
  const mockMap = new Map();
  mockMap.set('x-forwarded-for', '127.0.0.1');
  return {
    headers: vi.fn().mockResolvedValue({
      get: (key: string) => mockMap.get(key),
    }),
    cookies: vi.fn().mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }),
  };
});

// Mock NextAuth
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com',
      role: 'SUPER_ADMIN',
    },
  }),
}));
