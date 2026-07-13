import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IExchangeRate extends Document {
  baseCurrency: string;
  rates: Map<string, number>;
  updatedAt: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    baseCurrency: { type: String, required: true, unique: true },
    rates: { type: Map, of: Number, required: true },
  },
  { timestamps: true }
);

const ExchangeRate: Model<IExchangeRate> =
  mongoose.models.ExchangeRate || mongoose.model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);

export default ExchangeRate;
