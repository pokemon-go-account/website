import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
  passwordHash?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isSuspended: boolean;
  telegramUsername?: string;
  preferredContactMethod?: string;
  preferredContactId?: string;
  alternateContact?: string;
  isOnboarded: boolean;
  isEmailVerified: boolean;
  hasPaidVerificationDeposit: boolean;
  walletBalance: number;
  verificationOtp?: string;
  verificationOtpExpires?: Date;
  lastOtpSentAt?: Date;
  otpAttempts: number;
  adminRentPaidUntil?: Date; // Only relevant for ADMIN role
  resetOtp?: string;
  resetOtpExpires?: Date;
  forfeitCount: number;
  country?: string;
  isGuest?: boolean;
  guestSocialPlatform?: string;
  guestSocialId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: false },
    role: { type: String, enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], default: 'USER' },
    isSuspended: { type: Boolean, default: false },
    telegramUsername: { type: String, trim: true },
    preferredContactMethod: { type: String, default: 'telegram' },
    preferredContactId: { type: String, trim: true },
    alternateContact: { type: String, trim: true },
    isOnboarded: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    hasPaidVerificationDeposit: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0 },
    verificationOtp: { type: String, default: null },
    verificationOtpExpires: { type: Date, default: null },
    lastOtpSentAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    adminRentPaidUntil: { type: Date, default: null },
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
    forfeitCount: { type: Number, default: 0 },
    country: { type: String, trim: true, default: '' },
    isGuest: { type: Boolean, default: false },
    guestSocialPlatform: { type: String, trim: true },
    guestSocialId: { type: String, trim: true },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;