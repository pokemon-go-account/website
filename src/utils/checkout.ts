import { CartItem } from "@/store/useCartStore";

/**
 * Formats cart items and handles opening the Telegram admin link
 */
export function handleTelegramCheckout(items: CartItem[], totalPrice: number) {
  if (items.length === 0) return;

  // Uses env variable or standard default support username
  const adminUsername = process.env.NEXT_PUBLIC_TELEGRAM_ADMIN_USERNAME || "pokemon_go_auctions_admin";

  let message = `🛒 *NEW ORDER INVOICE*\n`;
  message += `───────────────────\n`;
  message += `I would like to purchase the following services/items:\n\n`;

  items.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    message += `${index + 1}️⃣ *${item.name}*\n`;
    message += `   Quantity: ${item.quantity}\n`;
    message += `   Price: $${item.price.toLocaleString()}\n`;
    message += `   Subtotal: $${subtotal.toLocaleString()}\n\n`;
  });

  message += `───────────────────\n`;
  message += `*Total Order Value:* $${totalPrice.toLocaleString()}\n`;
  message += `───────────────────\n\n`;
  message += `Please confirm my order and initiate secure escrow credentials vaulting.`;

  const encodedText = encodeURIComponent(message);
  const telegramUrl = `https://t.me/${adminUsername}?text=${encodedText}`;

  window.open(telegramUrl, "_blank");
}
