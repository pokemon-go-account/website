import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 100% Instant Client-Side Country Resolution.
 * Uses session user country from MongoDB/onboarding, falling back to browser timezone.
 * Zero Vercel serverless function invocations or backend CPU execution.
 */
export function getUserCountry(sessionUser?: any): string {
  if (sessionUser?.country && sessionUser.country !== "N/A" && sessionUser.country !== "Unknown") {
    return sessionUser.country;
  }
  if (typeof window !== "undefined") {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Kolkata") || tz.includes("India")) return "India";
      if (tz.includes("London")) return "United Kingdom";
      if (tz.includes("New_York") || tz.includes("Chicago") || tz.includes("Los_Angeles") || tz.includes("Denver") || tz.includes("Phoenix") || tz.includes("Honolulu")) return "United States";
      if (tz.includes("Toronto") || tz.includes("Vancouver") || tz.includes("Edmonton")) return "Canada";
      if (tz.includes("Sydney") || tz.includes("Melbourne") || tz.includes("Brisbane") || tz.includes("Perth")) return "Australia";
      if (tz.includes("Berlin") || tz.includes("Frankfurt")) return "Germany";
      if (tz.includes("Paris")) return "France";
      if (tz.includes("Tokyo")) return "Japan";
      if (tz.includes("Singapore")) return "Singapore";
      if (tz.includes("Dubai")) return "United Arab Emirates";
    } catch (_) {}
  }
  return "United States";
}
