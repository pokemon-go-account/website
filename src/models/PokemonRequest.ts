import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPokemonRequest extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  email: string;
  pokemonName: string;
  description: string;
  socialPlatform: string;
  socialId: string;
  status: "PENDING" | "COMPLETED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
}

const PokemonRequestSchema: Schema<IPokemonRequest> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    pokemonName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    socialPlatform: { type: String, required: true, trim: true },
    socialId: { type: String, required: true, trim: true },
    status: { type: String, enum: ["PENDING", "COMPLETED", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true }
);

PokemonRequestSchema.index({ userId: 1 });
PokemonRequestSchema.index({ status: 1 });
PokemonRequestSchema.index({ createdAt: -1 });

const PokemonRequest: Model<IPokemonRequest> =
  mongoose.models.PokemonRequest || mongoose.model<IPokemonRequest>("PokemonRequest", PokemonRequestSchema);

export default PokemonRequest;
