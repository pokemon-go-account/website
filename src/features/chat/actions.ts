"use server";

import { auth } from "@/auth";

export async function uploadChatImage(base64Data: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }
    const { uploadToCloudinary } = await import("@/lib/cloudinary");
    const url = await uploadToCloudinary(base64Data);
    return { success: true, url };
  } catch (err: any) {
    console.error("Upload chat image error:", err);
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

/**
 * Delete an array of Cloudinary chat image URLs.
 * Called by the admin panel when a chat ticket is cleared.
 * Requires SUPER_ADMIN or ADMIN role.
 */
export async function deleteChatImages(imageUrls: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role || "")) {
      return { success: false, error: "Unauthorized" };
    }

    if (!imageUrls || imageUrls.length === 0) {
      return { success: true };
    }

    const { deleteFromCloudinary } = await import("@/lib/cloudinary");
    await deleteFromCloudinary(imageUrls);
    return { success: true };
  } catch (err: any) {
    console.error("Delete chat images error:", err);
    return { success: false, error: err.message || "Failed to delete images" };
  }
}

/**
 * Server Action: Generate a Firebase Custom Token for the logged-in user session
 */
export async function getFirebaseCustomToken(): Promise<{ success: boolean; customToken?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized" };
    }
    const { getAuth } = await import("firebase-admin/auth");
    await import("@/lib/firebase-admin");
    
    const firebaseAuth = getAuth();
    const customToken = await firebaseAuth.createCustomToken(session.user.id, {
      role: (session.user as any).role || "USER",
    });
    return { success: true, customToken };
  } catch (err: any) {
    console.error("Failed to create Firebase custom token:", err);
    return { success: false, error: err.message || "Failed to create token" };
  }
}

export interface ChatWebhookPayload {
  ticketId: string;
  ticketTitle: string;
  senderName: string;
  senderType: "user" | "admin" | "system";
  text?: string;
  hasImage?: boolean;
  userEmail?: string;
}

/**
 * Server Action: Send safe Webhook notification (Discord / Telegram / Generic Webhook)
 * Executed on server-side only so Webhook URLs and Bot tokens are never exposed to browser client.
 */
export async function sendChatWebhookNotification(payload: ChatWebhookPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      console.warn("[Chat Webhook] ⚠️ Unauthorized webhook trigger attempt block.");
      return { success: false, error: "Unauthorized" };
    }

    const discordWebhookUrl = process.env.DISCORD_CHAT_WEBHOOK_URL;
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    const genericWebhookUrl = process.env.CHAT_WEBHOOK_URL;
    const { ticketId, ticketTitle, senderName, senderType, text = "", hasImage = false, userEmail } = payload;

    const isAuction = ticketId.startsWith("auction-") || text.includes("BID PLACED");
    const isOrder = ticketId.startsWith("order-") || text.includes("NEW ORDER") || text.includes("BUY NOW");
    const isRecovery = ticketId.startsWith("recovery-") || text.includes("RECOVERY");

    // Formatting titles & color themes
    let headerTitle = "💬 NEW CUSTOMER MESSAGE";
    let embedColor = 0x8b5cf6; // Purple
    let categoryBadge = "Support Chat";

    if (isAuction) {
      headerTitle = "🔨 NEW AUCTION BID PLACED";
      embedColor = 0x10b981; // Emerald Green
      categoryBadge = "Live Auction Bidding";
    } else if (isOrder) {
      headerTitle = "📦 NEW ORDER NOTIFICATION";
      embedColor = 0x3b82f6; // Blue
      categoryBadge = "Order Checkout";
    } else if (isRecovery) {
      headerTitle = "🔑 NEW RECOVERY REQUEST";
      embedColor = 0xf59e0b; // Amber / Gold
      categoryBadge = "Account Recovery Service";
    } else if (text.includes("ticket opened") || text.includes("System:")) {
      headerTitle = "🎟️ NEW SUPPORT TICKET";
    }

    // Clean up message preview (truncate if extremely long, max 1000 chars for Discord field)
    const cleanText = text.trim();
    const formattedMessage = cleanText.length > 900 ? cleanText.substring(0, 900) + "\n... (truncated)" : cleanText;
    const finalContentText = formattedMessage || (hasImage ? "📷 [Sent an Image Attachment]" : "No text content");

    console.log(`[Chat Webhook] 🚀 Triggering Chat Notification | Category: ${categoryBadge} | TicketId: ${ticketId} | Sender: ${senderName}`);

    if (!discordWebhookUrl && !telegramBotToken && !genericWebhookUrl) {
      console.log("[Chat Webhook] ℹ️ No webhook URLs configured in environment. Skipping dispatch.");
      return { success: true };
    }

    const promises: Promise<any>[] = [];

    // 1. DISCORD WEBHOOK NOTIFICATION (Rich Embed)
    if (discordWebhookUrl) {
      const discordPayload = {
        username: "Pokemon GO Store Notifications",
        avatar_url: "https://cdn-icons-png.flaticon.com/512/188/188987.png",
        embeds: [
          {
            title: `${headerTitle} • #${ticketId.substring(0, 14)}`,
            color: embedColor,
            description: `**Channel / Title:** ${ticketTitle}\n\n\`\`\`text\n${finalContentText}\n\`\`\``,
            fields: [
              { name: "👤 Customer", value: `\`${senderName}\``, inline: true },
              { name: "✉️ Email", value: userEmail ? `\`${userEmail}\`` : "`N/A`", inline: true },
              { name: "📁 Category", value: `\`${categoryBadge}\``, inline: true },
              { name: "🆔 Thread ID", value: `\`${ticketId}\``, inline: true },
              ...(hasImage ? [{ name: "📷 Media", value: "`Image Attached`", inline: true }] : []),
            ],
            footer: {
              text: "Pokemon GO Auction & Support Desk • Live Sync",
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      promises.push(
        fetch(discordWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discordPayload),
        })
          .then((res) => {
            console.log(`[Chat Webhook] 🌐 Discord Webhook Sent Successfully | Status: ${res.status} ${res.statusText}`);
          })
          .catch((err) => console.error("[Chat Webhook] ❌ Discord notification failed:", err))
      );
    }

    // 2. TELEGRAM BOT NOTIFICATION (HTML Formatted)
    if (telegramBotToken && telegramChatId) {
      const escapeHtml = (str: string) =>
        str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

      const safeTitle = escapeHtml(ticketTitle);
      const safeSender = escapeHtml(senderName);
      const safeEmail = userEmail ? escapeHtml(userEmail) : "N/A";
      const safeMessage = escapeHtml(finalContentText);

      const telegramText =
        `<b>${headerTitle}</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `👤 <b>Customer:</b> <code>${safeSender}</code>\n` +
        `✉️ <b>Email:</b> <code>${safeEmail}</code>\n` +
        `📁 <b>Category:</b> <code>${categoryBadge}</code>\n` +
        `🆔 <b>Thread ID:</b> <code>${ticketId}</code>\n` +
        `📌 <b>Title:</b> ${safeTitle}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `💬 <b>Message Details:</b>\n` +
        `<pre>${safeMessage}</pre>`;

      const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      promises.push(
        fetch(telegramUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: telegramText,
            parse_mode: "HTML",
          }),
        })
          .then(async (res) => {
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
              console.log(`[Chat Webhook] 📱 Telegram Bot Notification Sent Successfully | ChatID: ${telegramChatId} | Status: ${res.status}`);
            } else {
              console.error(`[Chat Webhook] ❌ Telegram Bot Error Response | Status: ${res.status} | Details:`, data);
            }
          })
          .catch((err) => console.error("[Chat Webhook] ❌ Telegram notification failed:", err))
      );
    }

    // 3. Generic Custom Webhook Notification
    if (genericWebhookUrl) {
      promises.push(
        fetch(genericWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: isOrder ? "chat.order_created" : isRecovery ? "chat.recovery_created" : "chat.support_created",
            timestamp: new Date().toISOString(),
            payload: {
              ticketId,
              ticketTitle,
              senderName,
              senderType,
              userEmail,
              category: categoryBadge,
              text: finalContentText,
              hasImage,
            },
          }),
        })
          .then((res) => {
            console.log(`[Chat Webhook] 🔗 Custom Webhook Sent Successfully | Status: ${res.status}`);
          })
          .catch((err) => console.error("[Chat Webhook] ❌ Custom webhook failed:", err))
      );
    }

    await Promise.allSettled(promises);
    return { success: true };
  } catch (err: any) {
    console.error("[Chat Webhook] ❌ Error triggering chat webhooks:", err);
    return { success: false, error: err.message || "Failed to send webhook notification" };
  }
}
