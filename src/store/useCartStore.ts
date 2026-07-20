import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      setIsOpen: (isOpen) => {
        console.log(`[CartStore] 🛒 Cart Drawer ${isOpen ? "Opened" : "Closed"}`);
        set({ isOpen });
      },
      addItem: (newItem) => {
        const currentItems = get().items;
        const existing = currentItems.find((item) => item.id === newItem.id);

        if (existing) {
          console.log(`[CartStore] ➕ Incrementing Cart Item Quantity -> "${newItem.name}" (New Qty: ${existing.quantity + 1})`);
          set({
            items: currentItems.map((item) =>
              item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          });
        } else {
          console.log(`[CartStore] 🛍️ Added New Item to Cart -> "${newItem.name}" (Price: $${newItem.price})`);
          set({ items: [...currentItems, { ...newItem, quantity: 1 }] });
        }
      },
      removeItem: (id) => {
        const target = get().items.find((i) => i.id === id);
        console.log(`[CartStore] 🗑️ Removed Item from Cart -> "${target?.name || id}"`);
        set({ items: get().items.filter((item) => item.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        const target = get().items.find((i) => i.id === id);
        if (quantity <= 0) {
          console.log(`[CartStore] 🗑️ Quantity dropped to 0 -> Removing "${target?.name || id}"`);
          get().removeItem(id);
          return;
        }
        console.log(`[CartStore] ✏️ Updated Quantity for "${target?.name || id}" -> ${quantity}`);
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => {
        console.log("[CartStore] 🧹 Cleared All Items from Cart");
        set({ items: [] });
      },
      getTotalPrice: () =>
        get().items.reduce((total, item) => total + item.price * item.quantity, 0),
      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: "pokemon-go-cart-storage",
      partialize: (state) => ({ items: state.items }), // Persist only items list, not open state
    }
  )
);
