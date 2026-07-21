import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number | null;
  imageUrl: string;
  quantity: number;
  type?: "PRODUCT" | "RECOVERY";
  recoveryRequestId?: string;
  pricePending?: boolean;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncRecoveryItems: (recoveryRequests: any[]) => void;
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

        const safeImageUrl = newItem.imageUrl && !newItem.imageUrl.startsWith("data:")
          ? newItem.imageUrl
          : "/recovery-service.png";

        const itemToAdd = { ...newItem, imageUrl: safeImageUrl };

        if (existing) {
          console.log(`[CartStore] ➕ Incrementing Cart Item Quantity -> "${newItem.name}" (New Qty: ${existing.quantity + 1})`);
          set({
            items: currentItems.map((item) =>
              item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          });
        } else {
          console.log(`[CartStore] 🛍️ Added New Item to Cart -> "${newItem.name}" (Price: ${newItem.price !== null ? "$" + newItem.price : "Pending"})`);
          set({ items: [...currentItems, { ...itemToAdd, quantity: 1 }] });
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
      syncRecoveryItems: (recoveryRequests: any[]) => {
        const currentItems = get().items;
        const productItems = currentItems.filter((i) => i.type !== "RECOVERY" && !i.recoveryRequestId);

        const recoveryItems: CartItem[] = recoveryRequests.map((req) => {
          const isQuoted = req.price !== null && req.price !== undefined && req.price > 0;
          const safeImageUrl = req.screenshotUrl && !req.screenshotUrl.startsWith("data:")
            ? req.screenshotUrl
            : "/recovery-service.png";

          return {
            id: `recovery_${req._id}`,
            name: `Account Recovery (Level ${req.accountLevel})`,
            price: isQuoted ? Number(req.price) : null,
            imageUrl: safeImageUrl,
            quantity: 1,
            type: "RECOVERY",
            recoveryRequestId: req._id,
            pricePending: !isQuoted,
          };
        });

        set({ items: [...productItems, ...recoveryItems] });
      },
      getTotalPrice: () =>
        get().items.reduce((total, item) => {
          if (item.pricePending || item.price === null || item.price === undefined) {
            return total;
          }
          return total + item.price * item.quantity;
        }, 0),
      getTotalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),
    }),
    {
      name: "pokemon-go-cart-storage",
      partialize: (state) => ({
        items: state.items.map((item) => ({
          ...item,
          imageUrl: item.imageUrl && !item.imageUrl.startsWith("data:") ? item.imageUrl : "/recovery-service.png",
        })),
      }),
    }
  )
);
