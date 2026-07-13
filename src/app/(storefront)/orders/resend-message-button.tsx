"use client";

import { useState } from "react";
import { Send, X, MessageSquare } from "lucide-react";

type Platform = "telegram" | "reddit" | "instagram" | "facebook";

interface ResendMessageButtonProps {
  orderId: string;
  orderType: string;
  items: string[];
  price: number;
}

export function ResendMessageButton({ orderId, orderType, items, price }: ResendMessageButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buildMessage = () => {
    const itemsList = items.join(", ");
    const formattedPrice = `$${price.toFixed(2)} USD`;
    return `Hi Pokémon GO Services! I would like to follow up on my pending ${orderType === "BUY_NOW" ? "Buy Now" : "Store"} order:
- Order ID: ${orderId}
- Items: ${itemsList}
- Total: ${formattedPrice}
Please let me know how to proceed with the payment!`;
  };

  const handlePlatform = async (platform: Platform) => {
    const message = buildMessage();

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // silently fail clipboard
    }

    if (platform === "telegram") {
      window.open(`https://telegram.me/pokemongoservicesadmin?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "reddit") {
      window.open(`https://www.reddit.com/message/compose/?to=PokemonGo-Services&subject=Order%20Follow%20Up&message=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    } else if (platform === "instagram") {
      alert("📋 Your order details have been copied to your clipboard! Paste it in the Instagram DM to proceed.");
      window.open("https://www.instagram.com/pokemongoservicesadmin/", "_blank", "noopener,noreferrer");
    } else if (platform === "facebook") {
      alert("📋 Your order details have been copied to your clipboard! Paste it in the Facebook message to proceed.");
      window.open("https://www.facebook.com/share/1LdWHj4HQz/?mibextid=wwXIfr", "_blank", "noopener,noreferrer");
    }

    setIsOpen(false);
  };

  const options: { platform: Platform; label: string; sub: string; color: string; badge: string; badgeColor: string }[] = [
    {
      platform: "telegram",
      label: "Send via Telegram",
      sub: "Message @pokemongoservicesadmin",
      color: "hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/[0.06]",
      badge: "Active",
      badgeColor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    {
      platform: "reddit",
      label: "Send via Reddit",
      sub: "DM u/PokemonGo-Services",
      color: "hover:border-orange-400 dark:hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-500/[0.06]",
      badge: "Active",
      badgeColor: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    },
    {
      platform: "instagram",
      label: "Send via Instagram",
      sub: "DM @pokemongoservicesadmin",
      color: "hover:border-pink-400 dark:hover:border-pink-500/50 hover:bg-pink-50 dark:hover:bg-pink-500/[0.06]",
      badge: "Active",
      badgeColor: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    },
    {
      platform: "facebook",
      label: "Send via Facebook",
      sub: "Message us on Facebook",
      color: "hover:border-blue-500 dark:hover:border-blue-600/50 hover:bg-blue-50 dark:hover:bg-blue-600/[0.06]",
      badge: "Active",
      badgeColor: "bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
  ];

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-500 dark:text-zinc-400 hover:border-violet-300 dark:hover:border-violet-500/30 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/[0.06] transition-all cursor-pointer"
      >
        <Send className="h-3 w-3" />
        Resend
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111111] shadow-2xl p-5 space-y-4">

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-0.5 pr-6">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-violet-500" />
                Resend Payment Message
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Choose a platform to resend your order details. Your message will be pre-filled.
              </p>
            </div>

            {/* Order ID pill */}
            <div className="bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] rounded-lg px-3 py-2">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">Order ID: {orderId}</p>
            </div>

            {/* Platform options */}
            <div className="space-y-2">
              {options.map((opt) => (
                <button
                  key={opt.platform}
                  onClick={() => handlePlatform(opt.platform)}
                  className={`w-full text-left rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3 transition-all cursor-pointer active:scale-[0.99] ${opt.color}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-white">{opt.label}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{opt.sub}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${opt.badgeColor}`}>
                      {opt.badge}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
              📋 Your order details are also copied to your clipboard as a backup.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
