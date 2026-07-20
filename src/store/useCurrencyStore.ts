import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "USD" | "EUR" | "INR" | "GBP" | "JPY";

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  INR: "₹",
  GBP: "£",
  JPY: "¥",
};

interface CurrencyState {
  currency: Currency;
  rates: Record<Currency, number>;
  isConverting: boolean;
  setCurrency: (currency: Currency) => Promise<void>;
  convert: (amountInUSD: number) => { amount: number; symbol: string; formatted: string };
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: "USD",
      rates: {
        USD: 1.0,
        EUR: 0.92,
        INR: 83.5,
        GBP: 0.79,
        JPY: 155.0,
      },
      isConverting: false,
      setCurrency: async (newCurrency) => {
        if (newCurrency === get().currency) return;

        // 1. Instantly update currency state in 0ms using existing rates
        set({ currency: newCurrency, isConverting: false });

        try {
          // 2. Fetch fresh MongoDB cached rates in background without blocking UI
          const { getLiveExchangeRates } = await import("@/features/store/currency-actions");
          const res = await getLiveExchangeRates();
          
          if (res.success && res.rates) {
            set({
              rates: res.rates as Record<Currency, number>,
            });
          }
        } catch (error) {
          console.error("Failed to refresh exchange rates in background:", error);
        }
      },
      convert: (amountInUSD) => {
        const { currency, rates } = get();
        const rate = rates[currency] || 1.0;
        const convertedAmount = amountInUSD * rate;
        const symbol = CURRENCY_SYMBOLS[currency];
        
        const hasDecimals = convertedAmount % 1 !== 0;
        const formattedAmount = (currency === "JPY" || !hasDecimals)
          ? Math.round(convertedAmount).toLocaleString()
          : convertedAmount.toFixed(2);
        
        return {
          amount: convertedAmount,
          symbol,
          formatted: `${symbol}${formattedAmount}`,
        };
      },
    }),
    {
      name: "pokemon-go-currency-storage",
      partialize: (state) => ({ currency: state.currency, rates: state.rates }),
    }
  )
);
