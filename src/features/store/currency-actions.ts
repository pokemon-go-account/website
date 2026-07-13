"use server";

import connectDB from "@/lib/db";
import ExchangeRate from "@/models/ExchangeRate";

export async function getLiveExchangeRates() {
  try {
    await connectDB();
    
    // Check if we have recent rates in DB (within 20 minutes)
    const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
    const existingRate = await ExchangeRate.findOne({ baseCurrency: "USD" });

    // If we have rates and they are less than 20 minutes old, return them directly from MongoDB
    if (existingRate && existingRate.updatedAt > twentyMinsAgo) {
      console.log(`[Currency API] Serving rates from MongoDB Cache (Last updated: ${existingRate.updatedAt.toISOString()})`);
      return { 
        success: true, 
        rates: Object.fromEntries(existingRate.rates) 
      };
    }

    // Otherwise, fetch new rates from the API
    console.log("[Currency API] Cache expired or missing. Fetching fresh rates from open.er-api.com...");
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) throw new Error("API responded with an error");
    const data = await res.json();
    
    if (data && data.rates) {
      const extractedRates = {
        USD: 1.0,
        EUR: data.rates.EUR || 0.92,
        INR: data.rates.INR || 83.5,
        GBP: data.rates.GBP || 0.79,
        JPY: data.rates.JPY || 155.0,
      };

      // Upsert the new rates into MongoDB
      await ExchangeRate.findOneAndUpdate(
        { baseCurrency: "USD" },
        { 
          baseCurrency: "USD",
          rates: extractedRates,
        },
        { upsert: true, new: true }
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
