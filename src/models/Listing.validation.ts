import { z } from 'zod';

// Zod Validation Schema for incoming API payloads & forms
export const ListingValidationSchema = z.object({
  telegramUsername: z.string().min(2, "Telegram username is required"),
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Provide a comprehensive description"),
  level: z.number().min(1).max(50),
  xp: z.number().nonnegative(),
  stardust: z.number().nonnegative(),
  team: z.enum(['MYSTIC', 'VALOR', 'INSTINCT', 'NONE']),
  shinyCount: z.number().nonnegative(),
  legendaryCount: z.number().nonnegative(),
  mythicalCount: z.number().nonnegative(),
  region: z.string().min(2, "Region is required"),
  screenshots: z.array(z.string().url()).min(1, "At least one screenshot is mandatory"),
  startingBid: z.number().positive("Starting bid must be greater than 0"),
  reservePrice: z.number().positive("Reserve price must be greater than 0"),
  minIncrement: z.number().positive("Minimum increment must be greater than 0"),
  durationHours: z.number().min(1).max(168), // Max 1 week
});
