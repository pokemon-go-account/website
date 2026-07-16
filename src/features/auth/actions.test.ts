import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import User from '@/models/User';
import * as actions from './actions';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { verifyFirebaseIdToken } from '@/lib/firebase-admin';
import { signIn, auth } from '@/auth';
import { AuthError } from 'next-auth';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/recaptcha', () => ({
  verifyRecaptchaToken: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  verifyFirebaseIdToken: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
}));

describe('Auth Actions', () => {
  beforeAll(async () => {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    vi.clearAllMocks();
    
    // Default mocks
    vi.mocked(verifyRecaptchaToken).mockResolvedValue({ success: true, score: 0.9 } as any);
  });

  describe('loginUser', () => {
    it('returns error if recaptcha fails', async () => {
      vi.mocked(verifyRecaptchaToken).mockResolvedValue({ success: false, error: 'Failed captcha' } as any);
      const formData = new FormData();
      const res = await actions.loginUser(null, formData);
      expect(res).toEqual({ success: false, error: 'Failed captcha' });
    });

    it('returns error if validation fails', async () => {
      const formData = new FormData();
      formData.set('email', 'invalid');
      formData.set('password', '123');
      const res = await actions.loginUser(null, formData);
      expect(res.success).toBe(false);
      expect(res.error).toBe('Please enter a valid email address');
    });

    it('returns success and calls signIn on valid input', async () => {
      const formData = new FormData();
      formData.set('email', 'test@test.com');
      formData.set('password', 'password123');
      
      const error = new Error('NEXT_REDIRECT') as any;
      error.digest = 'NEXT_REDIRECT;replace;/dashboard';
      vi.mocked(signIn).mockRejectedValueOnce(error); // Next.js redirects by throwing

      const res = await actions.loginUser(null, formData);
      expect(res).toEqual({ success: true, redirectTo: '/dashboard', error: null });
      expect(signIn).toHaveBeenCalledWith('credentials', {
        email: 'test@test.com',
        password: 'password123',
        redirectTo: '/',
      });
    });

    it('handles AuthError CredentialsSignin', async () => {
      const formData = new FormData();
      formData.set('email', 'test@test.com');
      formData.set('password', 'password123');
      
      const authError = new AuthError('CredentialsSignin', { type: 'CredentialsSignin' } as any);
      authError.type = 'CredentialsSignin';
      vi.mocked(signIn).mockRejectedValueOnce(authError);

      const res = await actions.loginUser(null, formData);
      expect(res).toEqual({ success: false, error: 'Invalid credentials.' });
    });
  });

  describe('registerUser', () => {
    it('returns error if recaptcha fails', async () => {
      vi.mocked(verifyRecaptchaToken).mockResolvedValue({ success: false, error: 'Failed captcha' } as any);
      const formData = new FormData();
      const res = await actions.registerUser(null, formData);
      expect(res.success).toBe(false);
    });

    it('returns error if user already exists', async () => {
      await User.create({
        username: 'existing',
        email: 'test@test.com',
        passwordHash: 'hash',
        role: 'USER',
      });

      const formData = new FormData();
      formData.set('email', 'test@test.com');
      formData.set('password', 'password123');
      
      const res = await actions.registerUser(null, formData);
      expect(res).toEqual({ success: false, error: 'An account with this email already exists.' });
    });

    it('registers user successfully', async () => {
      const formData = new FormData();
      formData.set('email', 'new@test.com');
      formData.set('password', 'password123');
      
      const res = await actions.registerUser(null, formData);
      expect(res).toEqual({ success: true, error: null });

      const user = await User.findOne({ email: 'new@test.com' });
      expect(user).toBeTruthy();
      expect(user?.role).toBe('USER');
    });
  });

  describe('updateUserProfileTelegram', () => {
    it('returns error if not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null as any);
      const res = await actions.updateUserProfileTelegram(null, new FormData());
      expect(res.success).toBe(false);
    });

    it('updates telegram username', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@test.com',
        role: 'USER',
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const formData = new FormData();
      formData.set('telegramUsername', 'newhandle');
      
      const res = await actions.updateUserProfileTelegram(null, formData);
      expect(res.success).toBe(true);

      const updated = await User.findById(user._id);
      expect(updated?.telegramUsername).toBe('@newhandle');
    });
  });

  describe('completeUserProfile', () => {
    it('updates user profile correctly', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@test.com',
        role: 'USER',
        isOnboarded: false,
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const formData = new FormData();
      formData.set('name', 'John Doe');
      formData.set('preferredContactMethod', 'reddit');
      formData.set('preferredContactId', 'johndoe');
      formData.set('country', 'United States');
      
      const res = await actions.completeUserProfile(null, formData);
      expect(res.success).toBe(true);
      expect(res.role).toBe('USER');

      const updated = await User.findById(user._id);
      expect(updated?.name).toBe('John Doe');
      expect(updated?.preferredContactId).toBe('u/johndoe');
      expect(updated?.country).toBe('United States');
      expect(updated?.isOnboarded).toBe(true);
    });
  });

  describe('loginWithFirebaseIdToken', () => {
    it('creates new user and signs in if not exists', async () => {
      vi.mocked(verifyFirebaseIdToken).mockResolvedValue({
        uid: 'fb123',
        email: 'fb@test.com',
        name: 'FB User',
      } as any);

      const error = new Error('NEXT_REDIRECT') as any;
      error.digest = 'NEXT_REDIRECT;replace;/profile/complete';
      vi.mocked(signIn).mockRejectedValueOnce(error);

      const res = await actions.loginWithFirebaseIdToken('token');
      expect(res).toEqual({ success: true, redirectTo: '/profile/complete', error: null });

      const user = await User.findOne({ email: 'fb@test.com' });
      expect(user).toBeTruthy();
      expect(user?.isEmailVerified).toBe(true);
    });
  });

  describe('Password Reset', () => {
    it('requests OTP successfully', async () => {
      await User.create({
        username: 'testuser',
        email: 'reset@test.com',
        role: 'USER',
      });
      const res = await actions.requestPasswordResetOtp('reset@test.com');
      expect(res.success).toBe(true);

      const user = await User.findOne({ email: 'reset@test.com' });
      // resetOtpExpires should be set (truthy), confirming OTP was saved
      expect(user?.resetOtpExpires).toBeTruthy();
    });

    it('verifies OTP successfully', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await User.create({
        username: 'testuser',
        email: 'reset@test.com',
        role: 'USER',
        resetOtp: '123456',
        resetOtpExpires: expires,
      });

      const res = await actions.verifyPasswordResetOtp('reset@test.com', '123456');
      expect(res.success).toBe(true);
    });

    it('resets password with OTP', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      await User.create({
        username: 'testuser',
        email: 'reset@test.com',
        role: 'USER',
        resetOtp: '123456',
        resetOtpExpires: expires,
      });

      const res = await actions.resetPasswordWithOtp('reset@test.com', '123456', 'newpass123');
      expect(res.success).toBe(true);

      const user = await User.findOne({ email: 'reset@test.com' });
      // Mongoose stores cleared fields as null (not undefined) when schema has default: null
      expect(user?.resetOtp).toBeFalsy();
      
      const isMatch = await bcrypt.compare('newpass123', user?.passwordHash as string);
      expect(isMatch).toBe(true);
    });
  });

  describe('Register OTP', () => {
    it('verifies register OTP', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const user = await User.create({
        username: 'testuser',
        email: 'otp@test.com',
        role: 'USER',
        verificationOtp: '123456',
        verificationOtpExpires: expires,
        isEmailVerified: false,
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const formData = new FormData();
      formData.set('otp', '123456');
      
      const res = await actions.verifyRegisterOtp(null, formData);
      expect(res.success).toBe(true);

      const updated = await User.findById(user._id);
      expect(updated?.isEmailVerified).toBe(true);
      // Mongoose stores cleared fields as null (not undefined) when schema has default: null
      expect(updated?.verificationOtp).toBeFalsy();
    });

    it('handles wrong OTP and increments attempts', async () => {
      const expires = new Date(Date.now() + 15 * 60 * 1000);
      const user = await User.create({
        username: 'testuser',
        email: 'otp@test.com',
        role: 'USER',
        verificationOtp: '123456',
        verificationOtpExpires: expires,
        isEmailVerified: false,
        otpAttempts: 0,
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const formData = new FormData();
      formData.set('otp', '654321');
      
      const res = await actions.verifyRegisterOtp(null, formData);
      expect(res.success).toBe(false);

      const updated = await User.findById(user._id);
      expect(updated?.otpAttempts).toBe(1);
    });
  });

  describe('getFreshBalance', () => {
    it('returns wallet balance', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'balance@test.com',
        role: 'USER',
        walletBalance: 150,
      });
      vi.mocked(auth).mockResolvedValue({ user: { id: user._id.toString() } } as any);

      const balance = await actions.getFreshBalance();
      expect(balance).toBe(150);
    });
  });
});
