import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { getStoreProducts } from "@/features/store/actions";
import Product from "@/models/Product";
import Category from "@/models/Category";

describe("Storefront Product Operations", () => {
  let testCategory: any;

  beforeAll(async () => {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    await Category.deleteMany({});

    // Create a shared test category
    testCategory = await Category.create({
      name: "Test Category",
      slug: "test-category",
    });
  });

  it("should retrieve all product fields including discount, badge, and active limited-time deals", async () => {
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + 24);

    // 1. Create active products
    await Product.create([
      {
        name: "Standard Product",
        price: 10,
        categoryId: testCategory._id,
        imageUrl: "https://example.com/standard.png",
      },
      {
        name: "Discounted Product",
        price: 15,
        mrpPrice: 20,
        discountedPrice: 15,
        badge: "MOST_PURCHASED",
        categoryId: testCategory._id,
        imageUrl: "https://example.com/discounted.png",
      },
      {
        name: "Active Deal",
        price: 30,
        mrpPrice: 40,
        discountedPrice: 30,
        isLimitedDeal: true,
        dealExpiry: futureDate,
        categoryId: testCategory._id,
        imageUrl: "https://example.com/deal.png",
      },
      {
        name: "Zero Discount Product",
        price: 0,
        mrpPrice: 10,
        discountedPrice: 0,
        badge: "POPULAR",
        categoryId: testCategory._id,
        imageUrl: "https://example.com/zero.png",
      },
    ]);

    const res = await getStoreProducts();
    expect(res.success).toBe(true);
    expect(res.products).toHaveLength(4);

    // Find standard product
    const standard = res.products.find((p: any) => p.name === "Standard Product");
    expect(standard).toBeDefined();
    expect(standard.price).toBe(10);
    expect(standard.isLimitedDeal).toBeFalsy();

    // Find discounted product
    const discounted = res.products.find((p: any) => p.name === "Discounted Product");
    expect(discounted).toBeDefined();
    expect(discounted.price).toBe(15);
    expect(discounted.mrpPrice).toBe(20);
    expect(discounted.discountedPrice).toBe(15);
    expect(discounted.badge).toBe("MOST_PURCHASED");

    // Find active deal
    const deal = res.products.find((p: any) => p.name === "Active Deal");
    expect(deal).toBeDefined();
    expect(deal.isLimitedDeal).toBe(true);
    expect(deal.dealExpiry).toBeDefined();

    // Find zero discount product
    const zeroDiscount = res.products.find((p: any) => p.name === "Zero Discount Product");
    expect(zeroDiscount).toBeDefined();
    expect(zeroDiscount.price).toBe(0);
    expect(zeroDiscount.mrpPrice).toBe(10);
    expect(zeroDiscount.discountedPrice).toBe(0);
    expect(zeroDiscount.badge).toBe("POPULAR");
  });

  it("should demote expired limited-time deals to normal products", async () => {
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 2);

    await Product.create({
      name: "Expired Deal",
      price: 25,
      mrpPrice: 35,
      discountedPrice: 25,
      isLimitedDeal: true,
      dealExpiry: pastDate,
      categoryId: testCategory._id,
      imageUrl: "https://example.com/expired.png",
    });

    const res = await getStoreProducts();
    expect(res.success).toBe(true);
    expect(res.products).toHaveLength(1);

    const expiredProduct = res.products[0];
    expect(expiredProduct.name).toBe("Expired Deal");
    // Should be demoted to non-deal
    expect(expiredProduct.isLimitedDeal).toBe(false);
    expect(expiredProduct.dealExpiry).toBeNull();
  });
});
