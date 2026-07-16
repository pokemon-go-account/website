"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc,
  setDoc,
  limit,
  increment,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { getDb } from "@/lib/firestore";
import {
  MessageCircle,
  Search,
  Send,
  Loader2,
  Users,
  X,
  CheckCheck,
  ChevronLeft,
  MessageSquare,
  ShoppingBag,
  ChevronRight,
  FileDown,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChatImage, deleteChatImages } from "@/features/chat/actions";

interface ChatMeta {
  id: string; // doc ID (support-xxxx or order-xxxx)
  userId: string;
  username: string;
  email: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadByAdmin: number;
  unreadByUser: number;
  type?: "support" | "order";
  title?: string;
  status?: string;
  closed?: boolean;
  assignedAdminId?: string;
  assignedAdminName?: string;
}

interface Message {
  id: string;
  text?: string;
  sender: "user" | "admin";
  senderName: string;
  timestamp: any;
  image?: string;
}

function formatTime(ts: any) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

function formatMessageTime(ts: any) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AdminChatPanel() {
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get("userId");
  const queryUsername = searchParams.get("username");
  const queryEmail = searchParams.get("email");

  const [conversations, setConversations] = useState<ChatMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selected state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<"support" | "orders">("support");
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<ChatMeta | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const autoSelectedRef = useRef(false);

  // Sound effects
  const sendSoundRef = useRef<HTMLAudioElement | null>(null);
  const receiveSoundRef = useRef<HTMLAudioElement | null>(null);
  const prevMessagesRef = useRef<Message[]>([]);

  useEffect(() => {
    sendSoundRef.current = new Audio("/audio/custom-whatsapp-chat-animation_X8t2FkCu.mp3");
    receiveSoundRef.current = new Audio("/audio/custom-whatsapp-chat-animation_qyWzqrX9.mp3");
    [sendSoundRef, receiveSoundRef].forEach((r) => {
      if (r.current) { r.current.preload = "auto"; r.current.volume = 0.6; }
    });
  }, []);

  const playSound = useCallback((ref: React.RefObject<HTMLAudioElement | null>) => {
    try {
      if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
    } catch { /* silent */ }
  }, []);

  // Admin session for Get Assigned feature
  const { data: session } = useSession();
  const adminUsername = (session?.user as any)?.username || session?.user?.name || session?.user?.email || "Admin";
  const adminId = (session?.user as any)?.id || "";

  const handleAssign = async () => {
    if (!activeChatId) return;
    const db = getDb();
    const chatRef = doc(db, "supportChats", activeChatId);
    const msgsRef = collection(db, "supportChats", activeChatId, "messages");

    await updateDoc(chatRef, {
      assignedAdminId: adminId,
      assignedAdminName: adminUsername,
    });

    await addDoc(msgsRef, {
      text: `System: Admin - ${adminUsername} joined the chat`,
      sender: "admin",
      senderName: "System",
      timestamp: serverTimestamp(),
      read: true,
    });

    await updateDoc(chatRef, {
      lastMessage: `Admin - ${adminUsername} joined the chat`,
      lastMessageAt: serverTimestamp(),
      unreadByUser: increment(1),
    });
  };

  const handleDownloadPDF = () => {
    if (!activeChatId || !messages.length) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to download PDF");
      return;
    }

    const chatTitle = activeChat?.title || `Chat ${activeChatId}`;
    const customerName = selectedUser?.username || "User";
    const customerEmail = selectedUser?.email || "";

    const htmlContent = `
      <html>
        <head>
          <title>${chatTitle} - Chat Transcript</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1f2937; }
            h1 { font-size: 20px; font-weight: 850; text-transform: uppercase; margin-bottom: 5px; color: #111827; }
            p.meta { font-size: 11px; color: #6b7280; margin-bottom: 30px; }
            .message-container { display: flex; flex-direction: column; gap: 15px; }
            .message { padding: 12px 16px; border-radius: 12px; max-width: 80%; font-size: 12px; line-height: 1.5; }
            .message.admin { background-color: #f3f4f6; align-self: flex-start; border: 1px solid #e5e7eb; }
            .message.user { background-color: #6133e1; color: white; align-self: flex-end; }
            .message.system { background-color: #fef3c7; border: 1px solid #fde68a; color: #92400e; align-self: center; text-align: center; width: 100%; max-width: 100%; font-weight: 500; }
            .sender { font-size: 10px; font-weight: 700; margin-bottom: 4px; display: block; opacity: 0.8; }
            .time { font-size: 9px; margin-top: 6px; display: block; text-align: right; opacity: 0.6; }
            img { max-width: 100%; max-height: 250px; border-radius: 6px; margin-top: 8px; display: block; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>${chatTitle} Transcript</h1>
          <p class="meta">Customer: <strong>${customerName}</strong> (${customerEmail}) | Transcript generated on: ${new Date().toLocaleString()}</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin-bottom: 25px;" />
          <div class="message-container">
            ${messages.map(msg => {
              const isSystem = msg.text?.startsWith("System:") ?? false;
              const displayMsg = isSystem ? msg.text?.replace("System:", "").trim() : msg.text;
              const senderLabel = isSystem ? "System" : msg.sender === "admin" ? "Support Team" : customerName;
              const msgClass = isSystem ? "system" : msg.sender === "admin" ? "admin" : "user";
              
              return `
                <div class="message ${msgClass}">
                  <span class="sender">${senderLabel}</span>
                  ${msg.image ? `<img src="${msg.image}" />` : ""}
                  ${displayMsg ? `<div>${displayMsg.replace(/\\n/g, '<br/>')}</div>` : ""}
                   <span class="time">${new Date(msg.timestamp?.toDate ? msg.timestamp.toDate() : msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              `;
            }).join("")}
          </div>
          ${"<"}script${">"
          }setTimeout(function() { window.print(); setTimeout(function() { window.close(); }, 500); }, 250);${"<"}/script${">"}
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleClearChat = async () => {
    if (!activeChatId) return;
    if (!confirm("Are you sure you want to permanently delete all messages and close this chat? This action cannot be undone.")) return;

    setIsClearing(true);
    try {
      const db = getDb();
      
      const msgsRef = collection(db, "supportChats", activeChatId, "messages");
      const snap = await getDocs(msgsRef);

      // Collect all image URLs from messages before deleting them
      const imageUrlsToDelete: string[] = [];
      snap.docs.forEach((msgDoc) => {
        const data = msgDoc.data();
        if (data.image && typeof data.image === "string") {
          imageUrlsToDelete.push(data.image);
        }
      });

      // Delete Firestore message documents
      const deletePromises = snap.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete images from Cloudinary (server action, non-blocking on partial failure)
      if (imageUrlsToDelete.length > 0) {
        await deleteChatImages(imageUrlsToDelete);
      }

      await addDoc(msgsRef, {
        text: "System: This chat ticket has been closed and cleared permanently by the Administrator.",
        sender: "admin",
        senderName: "Support Team",
        timestamp: serverTimestamp(),
        read: true,
      });

      const chatRef = doc(db, "supportChats", activeChatId);
      await updateDoc(chatRef, {
        status: "closed",
        closed: true,
        lastMessage: "This chat has been closed and cleared.",
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: 0,
        unreadByUser: 1,
      });

    } catch (err) {
      console.error("Failed to clear chat:", err);
      alert("Failed to close and clear chat.");
    } finally {
      setIsClearing(false);
    }
  };

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
        sender: "admin",
        senderName: "Support Team",
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(chatRef, {
        lastMessage: "Sent an image",
        lastMessageAt: serverTimestamp(),
        unreadByUser: increment(1),
        unreadByAdmin: 0,
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

  // Load all conversations (real-time)
  useEffect(() => {
    const db = getDb();
    const chatsRef = collection(db, "supportChats");
    const q = query(chatsRef, orderBy("lastMessageAt", "desc"), limit(200));

    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMeta, "id">),
      }));
      setConversations(convs);
    });

    return unsub;
  }, []);

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

  // Auto-select user from query params if active
  useEffect(() => {
    if (queryUserId && !autoSelectedRef.current && conversations.length > 0) {
      // Find a conversation by this userId to extract details
      const userMatch = conversations.find((c) => c.userId === queryUserId);
      if (userMatch) {
        setSelectedUserId(queryUserId);
        autoSelectedRef.current = true;
      }
    }
  }, [queryUserId, conversations]);

  // Load messages for active conversation (real-time)
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      prevMessagesRef.current = [];
      return;
    }

    const db = getDb();
    const msgsRef = collection(db, "supportChats", activeChatId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Message, "id">),
      }));

      // Receive sound: new user message arrives while chat is open
      const prev = prevMessagesRef.current;
      if (prev.length > 0 && msgs.length > prev.length) {
        const newest = msgs[msgs.length - 1];
        if (newest.sender === "user") {
          playSound(receiveSoundRef);
        }
      }
      prevMessagesRef.current = msgs;
      setMessages(msgs);

      // Mark as read by admin
      const chatRef = doc(db, "supportChats", activeChatId);
      updateDoc(chatRef, { unreadByAdmin: 0 }).catch(() => {});
    });

    return unsub;
  }, [activeChatId, playSound]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || isSending || !activeChatId) return;
    setIsSending(true);
    setReplyText("");

    try {
      const db = getDb();
      const msgsRef = collection(db, "supportChats", activeChatId, "messages");
      const chatRef = doc(db, "supportChats", activeChatId);

      await addDoc(msgsRef, {
        text,
        sender: "admin",
        senderName: adminUsername,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadByUser: increment(1),
        unreadByAdmin: 0,
      });

      playSound(sendSoundRef);
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // --- CLIENT SIDE GROUPING OF USERS ---
  const uniqueUsers = conversations.reduce((acc, conv) => {
    const uId = conv.userId || conv.id; // fallback
    const idx = acc.findIndex((u) => u.userId === uId);
    const convTime = conv.lastMessageAt?.toDate ? conv.lastMessageAt.toDate().getTime() : 0;
    
    if (idx >= 0) {
      acc[idx].chats.push(conv);
      acc[idx].unreadCount += conv.unreadByAdmin ?? 0;
      const userTime = acc[idx].lastMessageAt?.toDate ? acc[idx].lastMessageAt.toDate().getTime() : 0;
      if (convTime > userTime) {
        acc[idx].lastMessageAt = conv.lastMessageAt;
        acc[idx].lastMessage = conv.lastMessage;
      }
    } else {
      acc.push({
        userId: uId,
        username: conv.username || "Unknown User",
        email: conv.email || "",
        lastMessageAt: conv.lastMessageAt,
        lastMessage: conv.lastMessage || "No messages yet",
        unreadCount: conv.unreadByAdmin ?? 0,
        chats: [conv],
      });
    }
    return acc;
  }, [] as Array<{
    userId: string;
    username: string;
    email: string;
    lastMessageAt: any;
    lastMessage: string;
    unreadCount: number;
    chats: ChatMeta[];
  }>);

  // Sort unique users by last active message
  uniqueUsers.sort((a, b) => {
    const tA = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate().getTime() : 0;
    const tB = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate().getTime() : 0;
    return tB - tA;
  });

  // Filter unique users by search query
  const filteredUsers = searchQuery.trim()
    ? uniqueUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : uniqueUsers;

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadByAdmin ?? 0), 0);

  // Get active selected user chats
  const selectedUser = uniqueUsers.find((u) => u.userId === selectedUserId);
  const selectedUserChats = (selectedUser?.chats || []).sort((a, b) => {
    const isClosedA = a.status === "closed" || (a as any).closed === true;
    const isClosedB = b.status === "closed" || (b as any).closed === true;

    if (isClosedA && !isClosedB) return 1;
    if (!isClosedA && isClosedB) return -1;

    const timeA = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate().getTime() : 0;
    const timeB = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate().getTime() : 0;
    return timeB - timeA;
  });
  
  const userSupportChats = selectedUserChats.filter(
    (c) => c.type === "support" || c.id.startsWith("support-")
  );
  const userOrderChats = selectedUserChats.filter(
    (c) => c.type === "order" || c.id.startsWith("order-")
  );

  const activeCategoryList = activeCategoryTab === "support" ? userSupportChats : userOrderChats;

  return (
    <div className="flex flex-1 min-h-0 rounded-lg border border-zinc-200 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111111] shadow-xs h-[640px] md:h-[720px]">
      
      {/* PANE 1: Unique Users List */}
      <div className={cn(
        "w-full md:w-72 shrink-0 flex flex-col border-r border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-black/10 h-full",
        selectedUserId ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">Customers</h2>
              <p className="text-[10px] text-zinc-500 mt-1">{uniqueUsers.length} user{uniqueUsers.length !== 1 ? "s" : ""}</p>
            </div>
            {totalUnread > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-md bg-[#6133e1] text-[10px] font-semibold text-white flex items-center justify-center">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              id="admin-chat-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customers…"
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-white dark:bg-[#151515] border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* User list content */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Users className="h-8 w-8 text-zinc-350 dark:text-zinc-650" />
              <p className="text-xs text-zinc-400">
                {searchQuery ? "No customers found" : "No user conversations"}
              </p>
            </div>
          )}

          {filteredUsers.map((u) => (
            <button
              key={u.userId}
              onClick={() => {
                setSelectedUserId(u.userId);
                setActiveChatId(null); // Reset active thread
              }}
              className={cn(
                "w-full text-left px-4 py-3.5 border-b border-zinc-100 dark:border-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between gap-2",
                selectedUserId === u.userId ? "bg-zinc-150/40 dark:bg-white/[0.04]" : ""
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar */}
                <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-900 dark:text-white text-[11px] font-bold uppercase">
                  {(u.username || u.email || "?")[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                    {u.username || "Unknown"}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">{u.email}</p>
                  <p className="text-[10px] text-zinc-400 truncate mt-1">
                    {u.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[8px] text-zinc-450 dark:text-zinc-500 font-bold uppercase">{formatTime(u.lastMessageAt)}</span>
                {u.unreadCount > 0 && (
                  <span className="h-4 w-4 rounded-md bg-[#6133e1] text-[9px] font-black text-white flex items-center justify-center">
                    {u.unreadCount > 9 ? "9+" : u.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PANE 2: User's Chats (Support Tickets & Orders) */}
      <div className={cn(
        "w-full md:w-64 shrink-0 flex flex-col border-r border-zinc-200 dark:border-white/[0.06] bg-zinc-50/20 dark:bg-black/5 h-full",
        !selectedUserId ? "hidden md:flex" : activeChatId ? "hidden md:flex" : "flex"
      )}>
        {/* Header with back button */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-[#111111] shrink-0">
          <button
            onClick={() => setSelectedUserId(null)}
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-150/40 dark:hover:bg-white/[0.06] transition-colors"
            title="Back to Customers"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-zinc-900 dark:text-white truncate uppercase tracking-wider">
              {selectedUser?.username || "Customer Chats"}
            </h3>
            <p className="text-[9px] text-zinc-505 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
              Categorized Chats
            </p>
          </div>
        </div>

        {/* Support & Orders Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-white/[0.06] p-1.5 bg-white dark:bg-zinc-950 shrink-0">
          <button
            onClick={() => setActiveCategoryTab("support")}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-black rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-wider",
              activeCategoryTab === "support"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent"
            )}
          >
            <MessageSquare className="h-3 w-3" />
            Support ({userSupportChats.length})
          </button>
          <button
            onClick={() => setActiveCategoryTab("orders")}
            className={cn(
              "flex-1 py-1.5 text-[10px] font-black rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer uppercase tracking-wider",
              activeCategoryTab === "orders"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent"
            )}
          >
            <ShoppingBag className="h-3 w-3" />
            Orders ({userOrderChats.length})
          </button>
        </div>

        {/* List of active category's chats */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeCategoryList.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-650 uppercase tracking-wide">
                No chats in this tab
              </p>
            </div>
          ) : (
            activeCategoryList.map((conv) => (
              <button
                key={conv.id}
                onClick={() => {
                  setActiveChatId(conv.id);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all border cursor-pointer flex items-center justify-between gap-1.5",
                  activeChatId === conv.id
                    ? "bg-[#6133e1]/5 border-[#6133e1]/20 dark:border-[#6133e1]/30"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-900/40 border-transparent"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                      {conv.title || "Chat Thread"}
                    </span>
                    {conv.unreadByAdmin > 0 && (
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-450 dark:text-zinc-500 truncate mt-0.5 font-medium leading-tight">
                    {conv.lastMessage || "No messages yet"}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0 ml-1" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* PANE 3: Chat Thread */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#111111]",
        !activeChatId ? "hidden md:flex" : "flex"
      )}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 bg-zinc-50/20 dark:bg-black/5">
            <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-white/[0.04]">
              <MessageCircle className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No Chat Selected</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[240px]">
                {selectedUserId 
                  ? "Select a support ticket or order coordination thread from the center panel to begin."
                  : "Choose a user from the customers panel to view their chats."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3 border-b border-zinc-200 dark:border-white/[0.06] flex items-center gap-3 bg-white dark:bg-[#111111] shrink-0">
              <button
                type="button"
                onClick={() => { setActiveChatId(null); }}
                className="md:hidden mr-1 p-1 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 truncate">
                    {activeChat?.type === "order" ? (
                      <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
                    ) : (
                      <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {activeChat?.title || "Live Chat"}
                  </h3>
                  {activeChat?.type === "order" ? (
                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1 rounded text-[8px] font-black uppercase border border-blue-500/10">Order</span>
                  ) : (
                    <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1 rounded text-[8px] font-black uppercase border border-amber-500/10">Support</span>
                  )}
                </div>
                <p className="text-[8px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
                  {selectedUser?.username} · {selectedUser?.email}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.06] hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-[10px] font-bold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  title="Download Chat as PDF"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={activeChat?.status === "closed" || isClearing}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-650 dark:text-red-400 text-[10px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-red-500/10"
                  title="Close & Clear Ticket"
                >
                  {isClearing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>{activeChat?.status === "closed" ? "Closed" : "Clear"}</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold pl-1.5 border-l border-zinc-200 dark:border-white/[0.06]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Desk</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-50/20 dark:bg-black/5 min-h-[220px]">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-655 font-bold uppercase tracking-wider">No messages yet in this conversation.</p>
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
                        : msg.sender === "admin"
                        ? "items-end"
                        : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] px-3.5 py-2 text-xs leading-relaxed border select-text",
                        isSystem
                          ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-555 dark:text-zinc-400 text-center rounded-lg font-medium"
                          : msg.sender === "admin"
                          ? "bg-zinc-900 dark:bg-white border-zinc-950 dark:border-zinc-100 text-white dark:text-zinc-900 rounded-2xl rounded-tr-sm shadow-sm"
                          : "bg-white dark:bg-[#151515] border-zinc-200 dark:border-white/[0.06] text-zinc-900 dark:text-white rounded-2xl rounded-tl-sm shadow-xs"
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
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[9px] text-zinc-400">
                        {isSystem ? "System" : msg.sender === "user" ? (selectedUser?.username || "User") : "You"} · {formatMessageTime(msg.timestamp)}
                      </span>
                      {msg.sender === "admin" && !isSystem && (
                        <CheckCheck className="h-3 w-3 text-[#6133e1] dark:text-purple-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input */}
            <div className="p-3.5 border-t border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] shrink-0">
              {activeChat?.status === "closed" ? (
                <div className="flex items-center justify-center p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                  🔒 This chat has been closed and cleared
                </div>
              ) : !activeChat?.assignedAdminId ? (
                /* No one assigned yet — show Get Assigned button */
                <div className="flex flex-col items-center gap-2 py-2">
                  <p className="text-[10px] text-zinc-400 font-semibold">No admin is assigned to this chat yet.</p>
                  <button
                    type="button"
                    onClick={handleAssign}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    ✋ Get Assigned
                  </button>
                </div>
              ) : (
                /* Someone is assigned */
                <div className="flex flex-col gap-2">
                  {/* Assignment banner */}
                  <div className={cn(
                    "flex items-center justify-between px-3 py-1.5 rounded-lg text-[10px] font-bold",
                    activeChat.assignedAdminId === adminId
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400"
                  )}>
                    <span>
                      {activeChat.assignedAdminId === adminId
                        ? `✅ You are handling this chat`
                        : `⚡ ${activeChat.assignedAdminName} is handling this chat`}
                    </span>
                    {activeChat.assignedAdminId !== adminId && (
                      <button
                        type="button"
                        onClick={handleAssign}
                        className="ml-2 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        Take Over
                      </button>
                    )}
                  </div>

                  {/* Reply input — all admins can send */}
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
                      className="h-9 w-9 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
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
                      id="admin-chat-reply-input"
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Reply to ${selectedUser?.username || "user"}…`}
                      disabled={isSending || isUploadingImage}
                      className="flex-1 bg-zinc-50 dark:bg-[#151515] text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-xl px-3 h-9 text-xs outline-none border border-zinc-200 dark:border-white/[0.08] focus:border-[#6133e1]/40 focus:bg-white dark:focus:bg-zinc-950 transition-all disabled:opacity-50"
                    />
                    <button
                      id="admin-chat-reply-send"
                      onClick={handleSendReply}
                      disabled={(!replyText.trim() && !isUploadingImage) || isSending || isUploadingImage}
                      className="h-9 px-4 rounded-xl bg-[#6133e1] hover:bg-[#5028c7] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 font-bold text-xs uppercase tracking-wider"
                      aria-label="Send reply"
                    >
                      {isSending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Reply"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
