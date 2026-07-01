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
  shinyCount: validateNumber("Shiny count is required", "Shiny count cannot be negative"),
  legendaryCount: validateNumber("Legendary count is required", "Legendary count cannot be negative"),
  mythicalCount: validateNumber("Mythical count is required", "Mythical count cannot be negative"),
  region: z.string().min(2, "Region is required"),
  screenshots: z.array(z.string().url()).min(1, "At least one screenshot is mandatory"),
  startingBid: validateNumber("Starting bid is required", "Starting bid must be greater than 0", true),
  reservePrice: validateNumber("Reserve price is required", "Reserve price must be greater than 0", true),
  minIncrement: validateNumber("Minimum increment is required", "Minimum increment must be greater than 0", true),
  durationHours: validateNumber("Duration is required").refine(val => val >= 1, "Duration must be at least 1 hour").refine(val => val <= 168, "Duration cannot exceed 168 hours"),
  
  // New Expanded Telemetry
  pokedexCompleted: validateNumber("Pokedex percentage is required").refine(val => val >= 0 && val <= 100, "Pokedex percentage must be between 0 and 100"),
  bestBuddyCount: validateNumber("Best Buddy count is required", "Best Buddy count cannot be negative"),
  pokeCoins: validateNumber("PokeCoins is required", "PokeCoins cannot be negative"),
  startDate: z.string().min(3, "Start date representation is required"),
  accountType: z.string().min(2, "Account type is required"),
  accountStatus: z.string().min(2, "Account standing details required"),
  weeklyDistance: validateNumber("Weekly distance is required", "Weekly distance cannot be negative"),
  topPokemon: z.string().optional(),
  
  // New Expanded Resources
  rareCandy: validateNumber("Rare Candy count is required", "Cannot be negative"),
  fastTm: validateNumber("Fast TM count is required", "Cannot be negative"),
  chargedTm: validateNumber("Charged TM count is required", "Cannot be negative"),
  eliteFastTm: validateNumber("Elite Fast TM count is required", "Cannot be negative"),
  eliteChargedTm: validateNumber("Elite Charged TM count is required", "Cannot be negative"),
  incubators: validateNumber("Incubators count is required", "Cannot be negative"),
  luckyEggs: validateNumber("Lucky Eggs count is required", "Cannot be negative"),
  lureModules: validateNumber("Lure Modules count is required", "Cannot be negative"),
  premiumRaidPass: validateNumber("Premium Raid Pass count is required", "Cannot be negative"),
});
