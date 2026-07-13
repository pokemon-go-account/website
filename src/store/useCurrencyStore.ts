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
        set({ isConverting: true });
        
        try {
          // Fetch actual live market rates from public open API
          const res = await fetch("https://open.er-api.com/v6/latest/USD");
          if (!res.ok) throw new Error("API responded with an error status code");
          const data = await res.json();
          if (data && data.rates) {
            set({
              currency: newCurrency,
              rates: {
                USD: 1.0,
                EUR: data.rates.EUR || 0.92,
                INR: data.rates.INR || 83.5,
                GBP: data.rates.GBP || 0.79,
                JPY: data.rates.JPY || 155.0,
              },
            });
          } else {
            throw new Error("Invalid exchange rate structure in response");
          }
        } catch (error) {
          console.error("Failed to fetch live market rates, falling back to simulated values:", error);
          
          // Simulated fallback rates
          const baseRates = {
            USD: 1.0,
            EUR: 0.90 + Math.random() * 0.04,
            INR: 83.0 + Math.random() * 1.0,
            GBP: 0.77 + Math.random() * 0.04,
            JPY: 153.0 + Math.random() * 4.0,
          };
          set({
            currency: newCurrency,
            rates: baseRates,
          });
        } finally {
          // Provide 800ms loading experience to match simulated visual loader transitions
          await new Promise((resolve) => setTimeout(resolve, 800));
          set({ isConverting: false });
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
