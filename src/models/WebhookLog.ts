import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWebhookLog extends Document {
  eventId: string;
  eventType: string;
  payload: string;
  status: 'PROCESSED' | 'DUPLICATE' | 'FAILED';
  errorMessage?: string;
  createdAt: Date;
}

const WebhookLogSchema: Schema<IWebhookLog> = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    payload: { type: String, required: true },
    status: { type: String, enum: ['PROCESSED', 'DUPLICATE', 'FAILED'], required: true },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

const WebhookLog: Model<IWebhookLog> = mongoose.models.WebhookLog || mongoose.model<IWebhookLog>('WebhookLog', WebhookLogSchema);
export default WebhookLog;
