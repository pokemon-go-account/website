"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  where,
  setDoc,
  updateDoc,
  increment,
  orderBy,
} from "firebase/firestore";
import { getDb } from "@/lib/firestore";
import {
  MessageSquare,
  ShoppingBag,
  Send,
  Loader2,
  Plus,
  ArrowLeft,
  ChevronRight,
  Maximize2,
  X,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChatImage } from "@/features/chat/actions";

interface ChatMeta {
  id: string;
  userId: string;
  username: string;
  email: string;
  type: "support" | "order";
  ticketId?: string;
  orderId?: string;
  title: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadByUser: number;
  unreadByAdmin: number;
  createdAt: any;
  status?: string;
  closed?: boolean;
}

interface Message {
  id: string;
  text?: string;
  sender: "user" | "admin";
  senderName: string;
  timestamp: any;
  image?: string;
}

interface UserChatPanelProps {
  isFullScreen?: boolean;
  initialChatId?: string | null;
  onClose?: () => void;
}

export function UserChatPanel({
  isFullScreen = false,
  initialChatId = null,
  onClose,
}: UserChatPanelProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"support" | "orders">("support");
  const [conversations, setConversations] = useState<ChatMeta[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [activeChat, setActiveChat] = useState<ChatMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      const res = await uploadChatImage(base64Data);
      if (!res.success || !res.url) {
        throw new Error(res.error || "Failed to upload image.");
      }

      const db = getDb();
      const chatRef = doc(db, "supportChats", activeChatId);
      const msgsRef = collection(db, "supportChats", activeChatId, "messages");

      await addDoc(msgsRef, {
        image: res.url,
        text: "",
        sender: "user",
        senderName: username,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(chatRef, {
        lastMessage: "Sent an image",
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: increment(1),
      });
    } catch (err: any) {
      console.error("Failed to upload/send image:", err);
      alert(err.message || "Failed to send image.");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const userId = (session?.user as any)?.id as string | undefined;
  const username =
    (session?.user as any)?.username ||
    session?.user?.name ||
    session?.user?.email ||
    "User";

  // Auto-select initialChatId if provided
  useEffect(() => {
    if (initialChatId) {
      setActiveChatId(initialChatId);
      // Auto-set the tab based on prefix
      if (initialChatId.startsWith("order-")) {
        setActiveTab("orders");
      } else {
        setActiveTab("support");
      }
    }
  }, [initialChatId]);

  // Sync activeChat when activeChatId or conversations change
  useEffect(() => {
    if (activeChatId) {
      const match = conversations.find((c) => c.id === activeChatId);
      if (match) {
        setActiveChat(match);
      }
    } else {
      setActiveChat(null);
    }
  }, [activeChatId, conversations]);

  // 1. Listen for ALL conversations belonging to this user
  useEffect(() => {
    if (!userId) return;
    const db = getDb();
    const chatsRef = collection(db, "supportChats");
    // Filter index-free by userId and sort client-side
    const q = query(chatsRef, where("userId", "==", userId));

    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMeta, "id">),
      }));

      // Sort client-side by status and then lastMessageAt descending
      convs.sort((a, b) => {
        const isClosedA = a.status === "closed" || a.closed === true;
        const isClosedB = b.status === "closed" || b.closed === true;

        if (isClosedA && !isClosedB) return 1;
        if (!isClosedA && isClosedB) return -1;

        const timeA = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate().getTime() : 0;
        const timeB = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate().getTime() : 0;
        return timeB - timeA;
      });

      setConversations(convs);
    });

    return unsub;
  }, [userId]);

  // 2. Listen for messages in the active conversation
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const db = getDb();
    const msgsRef = collection(db, "supportChats", activeChatId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))
      );

      // Mark as read by user
      const chatRef = doc(db, "supportChats", activeChatId);
      updateDoc(chatRef, { unreadByUser: 0 }).catch(() => {});
    });

    return unsub;
  }, [activeChatId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Filter conversations based on current tab
  const supportTickets = conversations.filter((c) => c.type === "support" || c.id.startsWith("support-"));
  const orderChats = conversations.filter((c) => c.type === "order" || c.id.startsWith("order-"));

  const handleCreateTicket = async () => {
    if (!userId || isCreatingTicket) return;
    setIsCreatingTicket(true);

    try {
      const db = getDb();
      // Generate a ticket ID: support-xxxxxxxx (8 hex chars)
      const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const ticketId = `support-${randomId}`;
      const chatRef = doc(db, "supportChats", ticketId);

      await setDoc(chatRef, {
        userId,
        username,
        email: session?.user?.email ?? "",
        type: "support",
        ticketId,
        title: `Ticket #${randomId}`,
        lastMessage: "Ticket created. Please describe your issue.",
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: 1,
        unreadByUser: 0,
        createdAt: serverTimestamp(),
      });

      const msgsRef = collection(db, "supportChats", ticketId, "messages");
      await addDoc(msgsRef, {
        text: "System: Support ticket created. Please write your question below and an administrator will reply shortly.",
        sender: "admin",
        senderName: "Support Team",
        timestamp: serverTimestamp(),
        read: false,
      });

      setActiveChatId(ticketId);
      setActiveTab("support");
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending || !activeChatId) return;
    setIsSending(true);
    setInputText("");

    try {
      const db = getDb();
      const chatRef = doc(db, "supportChats", activeChatId);
      const msgsRef = collection(db, "supportChats", activeChatId, "messages");

      await addDoc(msgsRef, {
        text,
        sender: "user",
        senderName: username,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: increment(1),
      });
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function formatTime(ts: any) {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // --- RENDERING SUB-VIEWS ---

  // Sidebar list view
  const renderSidebar = () => {
    const activeList = activeTab === "support" ? supportTickets : orderChats;

    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-black/10">
        {/* Compact Mode Header */}
        {!isFullScreen && (
          <div className="flex items-center justify-between px-4 py-3 bg-[#6133e1] text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-extrabold leading-none uppercase tracking-wider">Live Chat</p>
                <p className="text-[9px] text-violet-200 mt-0.5 font-bold uppercase tracking-wide">Support & Orders</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  window.location.href = "/chat";
                }}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Expand to Full Screen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Close Chat"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-white/[0.06] p-2 bg-white dark:bg-zinc-950">
          <button
            onClick={() => setActiveTab("support")}
            className={cn(
              "flex-1 py-2 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              activeTab === "support"
                ? "bg-[#6133e1]/10 text-[#6133e1] dark:text-purple-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Support
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={cn(
              "flex-1 py-2 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
              activeTab === "orders"
                ? "bg-[#6133e1]/10 text-[#6133e1] dark:text-purple-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            )}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Orders
          </button>
        </div>

        {/* Action Header */}
        <div className="p-3 bg-white dark:bg-zinc-950 border-b border-zinc-150 dark:border-white/[0.04]">
          {activeTab === "support" ? (
            <button
              onClick={handleCreateTicket}
              disabled={isCreatingTicket}
              className="w-full h-8 flex items-center justify-center gap-1.5 bg-[#6133e1] hover:bg-[#5028c7] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isCreatingTicket ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              Create Support Ticket
            </button>
          ) : (
            <p className="text-[10px] text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider text-center">
              Order Specific Live Chats
            </p>
          )}
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <p className="text-xs font-bold text-zinc-400 dark:text-zinc-650 uppercase tracking-wide">
                No chats found
              </p>
              <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px]">
                {activeTab === "support"
                  ? "Create a ticket above to start a conversation with support."
                  : "Manual order payments automatically spawn chats here."}
              </p>
            </div>
          ) : (
            activeList.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveChatId(conv.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer",
                  activeChatId === conv.id
                    ? "bg-[#6133e1]/5 border border-[#6133e1]/20 dark:border-[#6133e1]/30"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-transparent"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-zinc-900 dark:text-white truncate">
                      {conv.title || "Support Thread"}
                    </span>
                    {conv.unreadByUser > 0 && (
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate mt-0.5 font-medium">
                    {conv.lastMessage || "Click to open chat"}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-2" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  };

  // Main chat thread view
  const renderThread = () => {
    if (!activeChatId) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-zinc-50/20 dark:bg-black/5">
          <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-zinc-400" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">No Chat Selected</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[240px]">
              Select a conversation from the tab panel, or create a new support ticket.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50/20 dark:bg-zinc-950/20">
        {/* Thread Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-2 min-w-0">
            {/* Back button for compact view */}
            {(!isFullScreen || window.innerWidth < 768) && (
              <button
                onClick={() => setActiveChatId(null)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors mr-1 cursor-pointer"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 truncate">
                {activeChat?.type === "order" ? (
                  <ShoppingBag className="h-3.5 w-3.5 text-[#6133e1]" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5 text-[#6133e1]" />
                )}
                {activeChat?.title || "Live Chat"}
              </h3>
              <p className="text-[8px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
                {activeChat?.type === "order" ? "Order Coordination" : "Support Ticket"}
              </p>
            </div>
          </div>

          {/* Action buttons (Expand / Close) */}
          <div className="flex items-center gap-1">
            {!isFullScreen && (
              <button
                onClick={() => {
                  window.location.href = `/chat?chatId=${activeChatId}`;
                }}
                className="p-1.5 rounded-lg text-zinc-450 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Expand to Full Screen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-450 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {/* Scrollable Messages */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold uppercase tracking-wider">
                No messages yet
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isSystem = msg.text?.startsWith("System:") ?? false;
            const displayMsg = isSystem ? msg.text?.replace("System:", "").trim() : msg.text;
            
            return (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1",
                  isSystem
                    ? "items-center"
                    : msg.sender === "user"
                    ? "items-end"
                    : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl text-xs leading-relaxed px-3.5 py-2 select-text",
                    isSystem
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-center rounded-xl font-medium"
                      : msg.sender === "user"
                      ? "bg-[#6133e1] text-white rounded-br-sm shadow-sm"
                      : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 border border-zinc-150 dark:border-zinc-800 rounded-bl-sm shadow-xs"
                  )}
                >
                  {msg.image && (
                    <div className="mb-1.5 rounded-lg overflow-hidden border border-white/10 max-w-full">
                      <img
                        src={msg.image}
                        alt={msg.text || "Attached Image"}
                        className="max-h-48 object-contain w-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(msg.image, "_blank")}
                      />
                    </div>
                  )}
                  {displayMsg && <p className="whitespace-pre-wrap">{displayMsg}</p>}
                </div>
                <span className="text-[9px] text-zinc-400 px-1 font-medium leading-none">
                  {!isSystem && msg.sender === "admin" ? "Support Team · " : ""}
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-zinc-950 shrink-0">
          {activeChat?.status === "closed" ? (
            <div className="flex items-center justify-center p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-550 text-xs font-bold uppercase tracking-wider">
              🔒 This ticket has been closed
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={isSending || isUploadingImage}
                className="h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-355 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Attach Image"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#6133e1]" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                disabled={isSending || isUploadingImage}
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-xl px-3 h-9 text-xs outline-none border border-transparent focus:border-[#6133e1]/40 focus:bg-white dark:focus:bg-zinc-950 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !isUploadingImage) || isSending || isUploadingImage}
                className="h-9 w-9 rounded-xl bg-[#6133e1] hover:bg-[#5028c7] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Full Screen layout (Sidebar + Thread side-by-side)
  if (isFullScreen) {
    return (
      <div className="flex flex-1 min-h-0 rounded-2xl border border-zinc-200 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-zinc-950/80 backdrop-blur-md shadow-xl h-[640px] md:h-[720px]">
        {/* Left sidebar: hidden on mobile if thread is open */}
        <div className={cn(
          "w-full md:w-72 shrink-0 border-r border-zinc-200 dark:border-white/[0.06] flex flex-col h-full",
          activeChatId ? "hidden md:flex" : "flex"
        )}>
          {renderSidebar()}
        </div>
        {/* Right thread: hidden on mobile if list is open */}
        <div className={cn(
          "flex-1 flex flex-col h-full min-w-0",
          !activeChatId ? "hidden md:flex" : "flex"
        )}>
          {renderThread()}
        </div>
      </div>
    );
  }

  // Compact layout (for widget bottom right)
  return (
    <div className="flex flex-col h-[480px] w-full bg-white dark:bg-[#0d0d12]">
      {activeChatId ? renderThread() : renderSidebar()}
    </div>
  );
}
