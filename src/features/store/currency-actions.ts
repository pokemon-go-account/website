"use server";

import connectDB from "@/lib/db";
import ExchangeRate from "@/models/ExchangeRate";

export async function getLiveExchangeRates() {
  try {
    await connectDB();
    
    // Check if we have recent rates in DB (within 5 minutes)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingRate = await ExchangeRate.findOne({ baseCurrency: "USD" });

    // If we have rates and they are less than 5 minutes old, return them directly from MongoDB
    if (existingRate && existingRate.updatedAt > fiveMinsAgo) {
      console.log(`[Currency API] Serving rates from MongoDB Cache (Last updated: ${existingRate.updatedAt.toISOString()})`);
      return { 
        success: true, 
        rates: Object.fromEntries(existingRate.rates) 
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
