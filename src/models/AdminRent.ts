import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAdminRent extends Document {
  adminId: mongoose.Types.ObjectId;
  weekStart: Date;
  weekEnd: Date;
  amount: number; // Always 200
  status: 'PENDING' | 'PAID';
  markedPaidBy?: mongoose.Types.ObjectId; // SUPER_ADMIN who confirmed
  markedPaidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminRentSchema: Schema<IAdminRent> = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    weekEnd: { type: Date, required: true },
    amount: { type: Number, default: 200 },
    status: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
    markedPaidBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    markedPaidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AdminRentSchema.index({ adminId: 1, weekStart: -1 });

const AdminRent: Model<IAdminRent> =
  mongoose.models.AdminRent || mongoose.model<IAdminRent>('AdminRent', AdminRentSchema);

export default AdminRent;
