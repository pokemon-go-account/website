export interface ReplyToPayload {
  messageId: string;
  senderName: string;
  textPreview: string;
}

export interface ChatMessage {
  id: string;
  text?: string;
  type?: string;      // e.g. "rating_request"
  orderId?: string;   // present when type === "rating_request"
  sender: "user" | "admin" | "system";
  senderName: string;
  timestamp: any;
  image?: string;
  read?: boolean;
  replyTo?: ReplyToPayload;
  edited?: boolean;
  editedAt?: any;
}
