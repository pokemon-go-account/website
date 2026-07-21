import { describe, it, expect, beforeEach } from "vitest";

// Mock global window and localStorage for Zustand persist middleware inside Node.js
if (typeof window === "undefined") {
  const store = new Map();
  globalThis.window = {} as any;
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => { store.clear(); },
    length: 0,
    key: (index: number) => null,
  };
}

import { useCartStore } from "@/store/useCartStore";

describe("Zustand Cart Store & Sanitization Middleware", () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    useCartStore.getState().clearCart();
    useCartStore.getState().setIsOpen(false);
  });

  it("should initialize with an empty cart and closed drawer", () => {
    const state = useCartStore.getState();
    expect(state.items).toEqual([]);
    expect(state.isOpen).toBe(false);
  });

  it("should open and close the drawer successfully", () => {
    const store = useCartStore.getState();
    store.setIsOpen(true);
    expect(useCartStore.getState().isOpen).toBe(true);

    store.setIsOpen(false);
    expect(useCartStore.getState().isOpen).toBe(false);
  });

  it("should add new items and increment quantity if duplicate", () => {
    const store = useCartStore.getState();
    
    // Add Item 1
    store.addItem({
      id: "prod_1",
      name: "PGSharp Key",
      price: 5.0,
      imageUrl: "https://example.com/logo.png",
      type: "PRODUCT",
    });

    let state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(1);
    expect(state.items[0].name).toBe("PGSharp Key");

    // Add duplicate Item 1
    store.addItem({
      id: "prod_1",
      name: "PGSharp Key",
      price: 5.0,
      imageUrl: "https://example.com/logo.png",
      type: "PRODUCT",
    });

    state = useCartStore.getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].quantity).toBe(2); // Quantity incremented!
  });

  it("should update quantity and remove item if quantity <= 0", () => {
    const store = useCartStore.getState();
    store.addItem({
      id: "prod_2",
      name: "Pokecoins",
      price: 25.0,
      imageUrl: "https://example.com/coins.png",
    });

    store.updateQuantity("prod_2", 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);

    // Update quantity to 0 -> should delete item
    store.updateQuantity("prod_2", 0);
    expect(useCartStore.getState().items.length).toBe(0);
  });

  it("should compute correct total price and item counts", () => {
    const store = useCartStore.getState();
    store.addItem({ id: "item_a", name: "A", price: 10, imageUrl: "" });
    store.addItem({ id: "item_a", name: "A", price: 10, imageUrl: "" }); // qty = 2
    store.addItem({ id: "item_b", name: "B", price: 15, imageUrl: "" }); // qty = 1

    expect(store.getTotalItems()).toBe(3);
    expect(store.getTotalPrice()).toBe(35); // 20 + 15
  });

  it("should sync recovery requests, mapping them as RECOVERY type items", () => {
    const store = useCartStore.getState();
    
    const mockRequests = [
      {
        _id: "req_999",
        accountLevel: 45,
        price: 75.0,
        screenshotUrl: "https://example.com/proof.jpg",
      },
      {
        _id: "req_888",
        accountLevel: 30,
        price: null, // Price pending
        screenshotUrl: "",
      }
    ];

    store.syncRecoveryItems(mockRequests);

    const state = useCartStore.getState();
    expect(state.items.length).toBe(2);

    const item1 = state.items.find(i => i.id === "recovery_req_999");
    expect(item1).toBeDefined();
    expect(item1?.price).toBe(75.0);
    expect(item1?.type).toBe("RECOVERY");
    expect(item1?.recoveryRequestId).toBe("req_999");
    expect(item1?.pricePending).toBe(false);

    const item2 = state.items.find(i => i.id === "recovery_req_888");
    expect(item2?.price).toBeNull();
    expect(item2?.pricePending).toBe(true);
  });

  describe("Base64 LocalStorage Bloat Protection Middleware", () => {
    it("should sanitize base64 data URLs to fallback images on addition", () => {
      const store = useCartStore.getState();
      
      store.addItem({
        id: "prod_base64",
        name: "Oversized Screenshot Item",
        price: 9.99,
        // Heavy base64 data URL
        imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...",
        type: "PRODUCT",
      });

      const state = useCartStore.getState();
      // Should replace heavy base64 image with light fallback image
      expect(state.items[0].imageUrl).toBe("/recovery-service.png");
    });
  });
});
