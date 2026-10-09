"use server";

import connectDB from "@/lib/db";
import ExchangeRate from "@/models/ExchangeRate";

let memoryRates: Record<string, number> | null = null;
let memoryTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache window

export async function getLiveExchangeRates() {
  try {
    // 1. Fast in-memory check (0ms, no DB/network overhead)
    if (memoryRates && Date.now() - memoryTimestamp < CACHE_TTL_MS) {
      return { success: true, rates: memoryRates };
    }

    await connectDB();
    
    // 2. Check recent rates in MongoDB
    const cacheThreshold = new Date(Date.now() - CACHE_TTL_MS);
    const existingRate = await ExchangeRate.findOne({ baseCurrency: "USD" });

    // If we have rates and they are less than 30 minutes old, return them directly
    if (existingRate && existingRate.updatedAt > cacheThreshold) {
      console.log(`[Currency API] Serving rates from MongoDB Cache (Last updated: ${existingRate.updatedAt.toISOString()})`);
      const rates = Object.fromEntries(existingRate.rates);
      memoryRates = rates;
      memoryTimestamp = Date.now();
      return { 
        success: true, 
        rates, 
      };
    }

    // Otherwise, fetch new rates from the API with a 6s timeout
    console.log("[Currency API] Cache expired or missing. Fetching fresh rates from open.er-api.com...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "no-store", // Bypass Next.js static cache, always fetch fresh data since we cache in MongoDB!
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
    if (!res.ok) throw new Error("API responded with an error");
    const data = await res.json();
    
    if (data && data.rates) {
      const extractedRates = {
        USD: 1.0,
        EUR: typeof data.rates.EUR === "number" ? data.rates.EUR : 0.87,
        INR: typeof data.rates.INR === "number" ? data.rates.INR : 95.9,
        GBP: typeof data.rates.GBP === "number" ? data.rates.GBP : 0.75,
        JPY: typeof data.rates.JPY === "number" ? data.rates.JPY : 157.0,
      };

      // Upsert the new rates into MongoDB
      await ExchangeRate.findOneAndUpdate(
        { baseCurrency: "USD" },
        { 
          baseCurrency: "USD",
          rates: extractedRates,
        },
        { upsert: true, returnDocument: "after" }
      );

      console.log("[Currency API] Successfully fetched and cached new rates to MongoDB.");
      memoryRates = extractedRates;
      memoryTimestamp = Date.now();
      return { success: true, rates: extractedRates };
    }
    
    throw new Error("Invalid exchange rate structure in response");
  } catch (error) {
    console.error("Currency fetch error:", error);
    
    // Fallback to the last known good rates in DB if API fails
    try {
      const fallbackRate = await ExchangeRate.findOne({ baseCurrency: "USD" });
      if (fallbackRate) {
        return { success: true, rates: Object.fromEntries(fallbackRate.rates) };
      }
    } catch (_) {}

    return { success: false, error: "Failed to fetch rates" };
  }
}
