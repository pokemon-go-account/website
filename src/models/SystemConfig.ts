import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISystemConfig extends Document {
  key: string;
  maintenanceMode: boolean;
  contactEmail: string;
  updatedAt: Date;
  createdAt: Date;
}

const SystemConfigSchema: Schema<ISystemConfig> = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    maintenanceMode: { type: Boolean, default: false },
    contactEmail: { type: String, default: "support@pokemongo.com" },
  },
  { timestamps: true }
);

const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig ||
  mongoose.model<ISystemConfig>("SystemConfig", SystemConfigSchema);

export default SystemConfig;
