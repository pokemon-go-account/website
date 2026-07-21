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

// Mock chat actions to suppress real Discord/Telegram webhooks during testing
vi.mock('@/features/chat/actions', () => ({
  sendChatWebhookNotification: vi.fn().mockResolvedValue({ success: true }),
  uploadChatImage: vi.fn().mockResolvedValue({ success: true, url: 'https://example.com/mock.jpg' }),
  getFirebaseCustomToken: vi.fn().mockResolvedValue({ success: true, customToken: 'mock-token' }),
}));

// Mock firebase-admin and firebase-admin/firestore to avoid real Firestore operations/chat creation during tests
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    add: vi.fn().mockResolvedValue({ id: 'mock-msg-id' }),
    update: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue({}),
  }),
  FieldValue: {
    increment: vi.fn((val) => val),
    serverTimestamp: vi.fn(() => new Date()),
  },
}));

vi.mock('@/lib/firebase-admin', () => {
  const mockCollection = {
    add: vi.fn().mockResolvedValue({ id: 'mock-msg-id' }),
  };
  const mockDoc = {
    collection: vi.fn().mockReturnValue(mockCollection),
    update: vi.fn().mockResolvedValue({}),
    set: vi.fn().mockResolvedValue({}),
  };
  const mockDb = {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockDoc),
    }),
  };
  return {
    getAdminDb: vi.fn().mockReturnValue(mockDb),
    verifyFirebaseIdToken: vi.fn().mockResolvedValue({ uid: 'mock-uid' }),
  };
});


