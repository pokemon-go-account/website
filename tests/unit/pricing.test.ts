import { describe, it, expect } from "vitest";
import { getBuyNowPrice, isBuyNowAvailable } from "@/lib/pricing";

describe("Pricing Utilities", () => {
  it("should correctly calculate Buy Now price as 4x starting bid", () => {
    expect(getBuyNowPrice(50)).toBe(200);
    expect(getBuyNowPrice(100)).toBe(400);
    expect(getBuyNowPrice(250)).toBe(1000);
  });

  it("should accurately determine Buy Now availability based on 80% threshold", () => {
    const buyNowPrice = getBuyNowPrice(100); // 400
    // 80% threshold is 320

    expect(isBuyNowAvailable(0, buyNowPrice)).toBe(true);
    expect(isBuyNowAvailable(100, buyNowPrice)).toBe(true);
    expect(isBuyNowAvailable(319, buyNowPrice)).toBe(true);
    
    // Exactly at or above 80% threshold
    expect(isBuyNowAvailable(320, buyNowPrice)).toBe(false);
    expect(isBuyNowAvailable(350, buyNowPrice)).toBe(false);
    expect(isBuyNowAvailable(400, buyNowPrice)).toBe(false);
  });
});
