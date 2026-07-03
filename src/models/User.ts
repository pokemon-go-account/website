import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name?: string;
  email?: string;
  username?: string;
  phone?: string;
  passwordHash?: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  isSuspended: boolean;
  telegramUsername?: string;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: false }, // Optional for OAuth compatibility
    role: { type: String, enum: ['USER', 'SELLER', 'ADMIN'], default: 'USER' },
    isSuspended: { type: Boolean, default: false },
    telegramUsername: { type: String, trim: true },
    isOnboarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;