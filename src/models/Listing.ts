import mongoose, { Schema, Document, Model } from 'mongoose';
import { ListingValidationSchema } from './Listing.validation';

export interface IListing extends Document {
  sellerId: mongoose.Types.ObjectId;
  telegramUsername: string; // Internal-only validation field
  title: string;
  description: string;
  level: number;
  xp: number;
  stardust: number;
  team: 'MYSTIC' | 'VALOR' | 'INSTINCT' | 'NONE';
  shinyCount: number;
  legendaryCount: number;
  mythicalCount: number;
  region: string;
  screenshots: string[];
  startingBid: number;
  reservePrice: number;
  minIncrement: number;
  durationHours: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  credentialsVault?: string;
  escrowStage?: 'APPROVED' | 'LIVE' | 'AWAITING_PAYMENT' | 'CREDENTIALS_SECURED' | 'CREDENTIALS_DELIVERED' | 'FUNDS_RELEASED';
  
  // New Expanded Telemetry
  pokedexCompleted: number;
  bestBuddyCount: number;
  pokeCoins: number;
  startDate: string;
  accountType: string;
  accountStatus: string;
  weeklyDistance: number;
  topPokemon?: string;
  
  // New Expanded Resources
  rareCandy: number;
  fastTm: number;
  chargedTm: number;
  eliteFastTm: number;
  eliteChargedTm: number;
  incubators: number;
  luckyEggs: number;
  lureModules: number;
  premiumRaidPass: number;

  // New Pokemon specific stats fields
  platinumMedals?: number;
  legendaryPoses?: number;
  shinyPokemons?: number;
  shinyMythical?: number;
  shinyUltrabeasts?: number;
  shinyLegendaries?: number;
  legendaryPokemons?: number;
  ultrabeasts?: number;
  mythicalPokemons?: number;
  hundoMythicalLegendaryUltrabeast?: number;
  shundoLegendaryMythicalUltrabeast?: number;
  shundoPokemons?: number;
  hundoPokemons?: number;
  costumeShinies?: number;
  hatchedShinies?: number;
  luckyPokemons?: number;
  luckyLegendaries?: number;
  shinyLuckyLegendaries?: number;
  locationBackgroundLegendaryShiny?: number;
  specialBackgroundLegendaryShiny?: number;
  candyXlPokemons?: number;
  candyXlLegendaries?: number;
  bestBuddies?: number;
  dualMovePokemons?: number;
  shadowShinyPokemons?: number;
  pokemonStorage?: number;
  itemBagStorage?: number;
  masterBalls?: number;
  raidPasses?: number;
  superRocketRadar?: number;
  pokedexRegisteredNumber?: number;
  bansCount?: number;
}

const ListingSchema: Schema<IListing> = new Schema(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    telegramUsername: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    level: { type: Number, required: true },
    xp: { type: Number, required: true },
    stardust: { type: Number, required: true },
    team: { type: String, enum: ['MYSTIC', 'VALOR', 'INSTINCT', 'NONE'], required: true },
    shinyCount: { type: Number, default: 0 },
    legendaryCount: { type: Number, default: 0 },
    mythicalCount: { type: Number, default: 0 },
    region: { type: String, required: true },
    screenshots: [{ type: String, required: true }],
    startingBid: { type: Number, required: true },
    reservePrice: { type: Number, required: true },
    minIncrement: { type: Number, required: true },
    durationHours: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    adminNotes: { type: String },
    credentialsVault: { type: String },
    escrowStage: {
      type: String,
      enum: ['APPROVED', 'LIVE', 'AWAITING_PAYMENT', 'CREDENTIALS_SECURED', 'CREDENTIALS_DELIVERED', 'FUNDS_RELEASED'],
      default: 'APPROVED'
    },
    
    // New Expanded Telemetry
    pokedexCompleted: { type: Number, default: 0 },
    bestBuddyCount: { type: Number, default: 0 },
    pokeCoins: { type: Number, default: 0 },
    startDate: { type: String, required: true },
    accountType: { type: String, required: true },
    accountStatus: { type: String, required: true },
    weeklyDistance: { type: Number, default: 0 },
    topPokemon: { type: String, default: "" },
    
    // New Expanded Resources
    rareCandy: { type: Number, default: 0 },
    fastTm: { type: Number, default: 0 },
    chargedTm: { type: Number, default: 0 },
    eliteFastTm: { type: Number, default: 0 },
    eliteChargedTm: { type: Number, default: 0 },
    incubators: { type: Number, default: 0 },
    luckyEggs: { type: Number, default: 0 },
    lureModules: { type: Number, default: 0 },
    premiumRaidPass: { type: Number, default: 0 },

    // New Pokemon specific stats fields
    platinumMedals: { type: Number, default: 0 },
    legendaryPoses: { type: Number, default: 0 },
    shinyPokemons: { type: Number, default: 0 },
    shinyMythical: { type: Number, default: 0 },
    shinyUltrabeasts: { type: Number, default: 0 },
    shinyLegendaries: { type: Number, default: 0 },
    legendaryPokemons: { type: Number, default: 0 },
    ultrabeasts: { type: Number, default: 0 },
    mythicalPokemons: { type: Number, default: 0 },
    hundoMythicalLegendaryUltrabeast: { type: Number, default: 0 },
    shundoLegendaryMythicalUltrabeast: { type: Number, default: 0 },
    shundoPokemons: { type: Number, default: 0 },
    hundoPokemons: { type: Number, default: 0 },
    costumeShinies: { type: Number, default: 0 },
    hatchedShinies: { type: Number, default: 0 },
    luckyPokemons: { type: Number, default: 0 },
    luckyLegendaries: { type: Number, default: 0 },
    shinyLuckyLegendaries: { type: Number, default: 0 },
    locationBackgroundLegendaryShiny: { type: Number, default: 0 },
    specialBackgroundLegendaryShiny: { type: Number, default: 0 },
    candyXlPokemons: { type: Number, default: 0 },
    candyXlLegendaries: { type: Number, default: 0 },
    bestBuddies: { type: Number, default: 0 },
    dualMovePokemons: { type: Number, default: 0 },
    shadowShinyPokemons: { type: Number, default: 0 },
    pokemonStorage: { type: Number, default: 0 },
    itemBagStorage: { type: Number, default: 0 },
    masterBalls: { type: Number, default: 0 },
    raidPasses: { type: Number, default: 0 },
    superRocketRadar: { type: Number, default: 0 },
    pokedexRegisteredNumber: { type: Number, default: 0 },
    bansCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ListingSchema.index({ sellerId: 1, status: 1 });

ListingSchema.pre('save', function (this: any) {
  // Sync shiny
  if (this.shinyPokemons !== undefined && this.shinyPokemons !== 0) {
    this.shinyCount = this.shinyPokemons;
  } else if (this.shinyCount !== undefined && this.shinyCount !== 0) {
    this.shinyPokemons = this.shinyCount;
  }

  // Sync legendary
  if (this.legendaryPokemons !== undefined && this.legendaryPokemons !== 0) {
    this.legendaryCount = this.legendaryPokemons;
  } else if (this.legendaryCount !== undefined && this.legendaryCount !== 0) {
    this.legendaryPokemons = this.legendaryCount;
  }

  // Sync mythical
  if (this.mythicalPokemons !== undefined && this.mythicalPokemons !== 0) {
    this.mythicalCount = this.mythicalPokemons;
  } else if (this.mythicalCount !== undefined && this.mythicalCount !== 0) {
    this.mythicalPokemons = this.mythicalCount;
  }
});

const Listing: Model<IListing> = mongoose.models.Listing || mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;