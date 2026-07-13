import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import mongoose from 'mongoose';
import { getLiveExchangeRates } from './currency-actions';
import ExchangeRate from '@/models/ExchangeRate';

// Mock the global fetch API to avoid hitting the real external API during testing
global.fetch = vi.fn();

describe('Currency Server Actions', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }
    await mongoose.connection.db?.collection('exchangerates').deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should fetch fresh rates from the API if no cache exists, and save to DB', async () => {
    // Mock fetch response for open.er-api.com
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rates: {
          USD: 1,
          EUR: 0.95,
          INR: 84.0,
          GBP: 0.80,
          JPY: 150.0,
        }
      })
    });

    const result = await getLiveExchangeRates();
    
    expect(result.success).toBe(true);
    expect(result.rates).toBeDefined();
    expect(result.rates?.EUR).toBe(0.95);

    // Verify it was saved to the database
    const savedRates = await ExchangeRate.findOne({ baseCurrency: 'USD' });
    expect(savedRates).not.toBeNull();
    expect(savedRates?.rates.get('EUR')).toBe(0.95);
  });

  it('should serve rates directly from the MongoDB cache if recently updated (within 20 mins)', async () => {
    // We do NOT mock fetch here. If it calls fetch, it will fail because we expect it to hit the DB cache.
    (global.fetch as any).mockImplementationOnce(() => Promise.reject(new Error("Should not hit API")));

    const result = await getLiveExchangeRates();
    
    expect(result.success).toBe(true);
    expect(result.rates?.EUR).toBe(0.95); // Should match the DB cached value from previous test
  });
});
