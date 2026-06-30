import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  role: 'USER' | 'SELLER' | 'ADMIN';
  isSuspended: boolean;
  telegramUsername?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false }, // Optional for OAuth compatibility
    role: { type: String, enum: ['USER', 'SELLER', 'ADMIN'], default: 'USER' },
    isSuspended: { type: Boolean, default: false },
    telegramUsername: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexing email for ultra-fast lookup during authentication login flows
UserSchema.index({ email: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;