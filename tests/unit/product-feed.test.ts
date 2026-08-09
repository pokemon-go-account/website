import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { getProductFeedItems } from "@/lib/product-feed";

describe("Product Feed Items & Security", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("should return an array of ProductFeedItem objects without throwing errors", async () => {
    const items = await getProductFeedItems();
    expect(Array.isArray(items)).toBe(true);

    for (const item of items) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("description");
      expect(item).toHaveProperty("link");
      expect(item).toHaveProperty("imageLink");
      expect(item).toHaveProperty("price");
      expect(item.price).toMatch(/^\d+\.\d{2} USD$/);
      expect(["in_stock", "out_of_stock"]).toContain(item.availability);
      expect(["new", "used"]).toContain(item.condition);
    }
  });

  it("should enforce PRODUCT_FEED_SECRET authentication on XML feed route", async () => {
    process.env.PRODUCT_FEED_SECRET = "supersecret123";
    const { GET } = await import("@/app/feed/products.xml/route");

    // 1. Invalid key -> 403
    const reqInvalid = new NextRequest("http://localhost:3000/feed/products.xml?key=wrong");
    const resInvalid = await GET(reqInvalid);
    expect(resInvalid.status).toBe(403);

    // 2. Missing key -> 403
    const reqMissing = new NextRequest("http://localhost:3000/feed/products.xml");
    const resMissing = await GET(reqMissing);
    expect(resMissing.status).toBe(403);

    // 3. Valid key -> 200 XML
    const reqValid = new NextRequest("http://localhost:3000/feed/products.xml?key=supersecret123");
    const resValid = await GET(reqValid);
    expect(resValid.status).toBe(200);
    expect(resValid.headers.get("Content-Type")).toBe("application/xml; charset=utf-8");

    const xml = await resValid.text();
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">');
    expect(xml).toContain('<title>Pokémon GO Services Products</title>');
  });

  it("should enforce PRODUCT_FEED_SECRET authentication on JSON feed route", async () => {
    process.env.PRODUCT_FEED_SECRET = "supersecret123";
    const { GET } = await import("@/app/feed/products.json/route");

    // 1. Invalid key -> 403
    const reqInvalid = new NextRequest("http://localhost:3000/feed/products.json?key=wrong");
    const resInvalid = await GET(reqInvalid);
    expect(resInvalid.status).toBe(403);

    // 2. Valid key -> 200 JSON
    const reqValid = new NextRequest("http://localhost:3000/feed/products.json?key=supersecret123");
    const resValid = await GET(reqValid);
    expect(resValid.status).toBe(200);
    expect(resValid.headers.get("Content-Type")).toBe("application/json; charset=utf-8");

    const json = await resValid.json();
    expect(Array.isArray(json)).toBe(true);
  });
});
