/**
 * Centralized pricing calculations for auctions and products across the platform.
 */

/**
 * Calculates the fixed Buy Now price for an auction based on its starting bid.
 */
export function getBuyNowPrice(startingBid: number): number {
  return startingBid * 4;
}

/**
 * Determines whether the Buy Now option is still available given the current highest bid.
 * Buy Now is disabled once the active bid reaches or exceeds 80% of the Buy Now price.
 */
export function isBuyNowAvailable(currentHighestBid: number, buyNowPrice: number): boolean {
  return currentHighestBid < 0.8 * buyNowPrice;
}
