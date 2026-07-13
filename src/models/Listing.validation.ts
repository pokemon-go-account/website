import { z } from 'zod';

const validateNumber = (requiredMsg: string, rangeMsg?: string, isPositive = false) => {
  const base = z.number({ message: requiredMsg })
    .refine((val) => !isNaN(val), { message: requiredMsg });
  if (isPositive && rangeMsg) {
    return base.refine((val) => val > 0, { message: rangeMsg });
  } else if (rangeMsg) {
    return base.refine((val) => val >= 0, { message: rangeMsg });
  }
  return base;
};

// Zod Validation Schema for incoming API payloads & forms
export const ListingValidationSchema = z.object({
  telegramUsername: z.string().min(2, "Telegram username is required"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Provide a comprehensive description"),
  level: validateNumber("Trainer level is required").refine(val => val >= 1, "Trainer level must be at least 1"),
  xp: validateNumber("XP is required", "XP cannot be negative"),
  stardust: validateNumber("Stardust is required", "Stardust cannot be negative"),
  team: z.enum(['MYSTIC', 'VALOR', 'INSTINCT', 'NONE']),
  shinyCount: z.number(),
  legendaryCount: z.number(),
  mythicalCount: z.number(),
  region: z.string().min(2, "Region is required"),
  screenshots: z.array(z.string().url()).min(1, "At least one screenshot is mandatory"),
  startingBid: validateNumber("Starting bid is required", "Starting bid must be greater than 0", true),
  reservePrice: validateNumber("Reserve price is required", "Reserve price must be greater than 0", true),
  minIncrement: validateNumber("Minimum increment is required", "Minimum increment must be greater than 0", true),
  durationHours: validateNumber("Duration is required").refine(val => val >= 1, "Duration must be at least 1 hour").refine(val => val <= 168, "Duration cannot exceed 168 hours"),
  
  // New Expanded Telemetry
  pokedexCompleted: z.number(),
  bestBuddyCount: z.number(),
  pokeCoins: z.number(),
  startDate: z.string().min(3, "Start date representation is required"),
  accountType: z.string().min(2, "Account type is required"),
  accountStatus: z.string().min(2, "Account standing details required"),
  weeklyDistance: z.number(),
  topPokemon: z.string().optional(),
  
  // New Expanded Resources
  rareCandy: z.number(),
  fastTm: z.number(),
  chargedTm: z.number(),
  eliteFastTm: z.number(),
  eliteChargedTm: z.number(),
  incubators: z.number(),
  luckyEggs: z.number(),
  lureModules: z.number(),
  premiumRaidPass: z.number(),

  // New Pokemon specific stats fields
  platinumMedals: z.number(),
  legendaryPoses: z.number(),
  shinyPokemons: z.number(),
  shinyMythical: z.number(),
  shinyUltrabeasts: z.number(),
  shinyLegendaries: z.number(),
  legendaryPokemons: z.number(),
  ultrabeasts: z.number(),
  mythicalPokemons: z.number(),
  hundoMythicalLegendaryUltrabeast: z.number(),
  shundoLegendaryMythicalUltrabeast: z.number(),
  shundoPokemons: z.number(),
  hundoPokemons: z.number(),
  costumeShinies: z.number(),
  hatchedShinies: z.number(),
  luckyPokemons: z.number(),
  luckyLegendaries: z.number(),
  shinyLuckyLegendaries: z.number(),
  locationBackgroundLegendaryShiny: z.number(),
  specialBackgroundLegendaryShiny: z.number(),
  candyXlPokemons: z.number(),
  candyXlLegendaries: z.number(),
  bestBuddies: z.number(),
  dualMovePokemons: z.number(),
  shadowShinyPokemons: z.number(),
  pokemonStorage: z.number(),
  itemBagStorage: z.number(),
  masterBalls: z.number(),
  raidPasses: z.number(),
  superRocketRadar: z.number(),
  pokedexRegisteredNumber: z.number(),
  bansCount: z.number(),
});
