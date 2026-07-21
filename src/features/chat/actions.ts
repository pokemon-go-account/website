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
    const isNewTicket = text.includes("ticket opened") || text.includes("System:");
    const messagePreview = text.length > 280 ? text.substring(0, 280) + "..." : text || (hasImage ? "📷 Sent an image attachment" : "New message");

    console.log(`[Chat Webhook] 🚀 Triggering Chat Notification | Event: ${isNewTicket ? "New Ticket" : "New Message"} | TicketId: ${ticketId} | Sender: ${senderName} (${senderType})`);

    if (!discordWebhookUrl && !telegramBotToken && !genericWebhookUrl) {
      console.log("[Chat Webhook] ℹ️ No webhook URLs configured in environment. Skipping dispatch.");
      return { success: true };
    }

    const promises: Promise<any>[] = [];

    // 1. Discord Webhook Notification
    if (discordWebhookUrl) {
      const discordPayload = {
        username: "Chat Notification Bot",
        embeds: [
          {
            title: isNewTicket ? `🎟️ New Support Ticket #${ticketId}` : `💬 New Chat Message in ${ticketTitle}`,
            description: messagePreview,
            color: senderType === "user" ? 0x6133e1 : 0x10b981,
            fields: [
              { name: "Sender", value: `${senderName} (${senderType.toUpperCase()})`, inline: true },
              { name: "Ticket / Chat ID", value: ticketId, inline: true },
              ...(userEmail ? [{ name: "User Email", value: userEmail, inline: true }] : []),
            ],
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

    // 2. Telegram Bot Notification
    if (telegramBotToken && telegramChatId) {
      const telegramText = `<b>${isNewTicket ? "🎟️ New Support Ticket" : "💬 New Chat Message"}</b>\n\n` +
        `<b>Channel / Ticket:</b> ${ticketTitle} (${ticketId})\n` +
        `<b>From:</b> ${senderName} (${senderType.toUpperCase()})\n` +
        (userEmail ? `<b>Email:</b> ${userEmail}\n` : "") +
        `\n<b>Message:</b> ${messagePreview}`;

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
            event: isNewTicket ? "chat.ticket_created" : "chat.message_created",
            timestamp: new Date().toISOString(),
            payload: {
              ticketId,
              ticketTitle,
              senderName,
              senderType,
              userEmail,
              text: messagePreview,
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
