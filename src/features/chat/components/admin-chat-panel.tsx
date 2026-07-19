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
  Check,
  CheckCheck,
  ChevronLeft,
  MessageSquare,
  ShoppingBag,
  ChevronRight,
  FileDown,
  Trash2,
  Plus,
  Image as ImageIcon,
  ShieldCheck,
  Headset,
  Sparkles,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChatImage, deleteChatImages, getFirebaseCustomToken } from "@/features/chat/actions";
import { signInWithCustomToken } from "firebase/auth";
import { auth as clientAuth, database } from "@/lib/firebase";
import { ref, set, remove, onValue, onDisconnect, getDatabase } from "firebase/database";

interface ChatMeta {
  id: string; // doc ID (support-xxxx or order-xxxx)
  userId: string;
  username: string;
  email: string;
  lastMessage: string;
  lastMessageAt: any;
  createdAt?: any;
  unreadByAdmin: number;
  unreadByUser: number;
  type?: "support" | "order";
  title?: string;
  status?: string;
  closed?: boolean;
  assignedAdminId?: string;
  assignedAdminName?: string;
  paymentMethod?: string;
}

interface Message {
  id: string;
  text?: string;
  sender: "user" | "admin";
  senderName: string;
  timestamp: any;
  image?: string;
  read?: boolean;
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

function getPaymentMethod(conv: ChatMeta) {
  if (conv.paymentMethod) return conv.paymentMethod;
  const lastMsg = (conv.lastMessage || "").toLowerCase();
  const title = (conv.title || "").toLowerCase();
  if (lastMsg.includes("wise") || title.includes("wise")) return "Wise";
  if (lastMsg.includes("upi") || lastMsg.includes("utr") || title.includes("upi")) return "UPI";
  if (lastMsg.includes("paypal") || title.includes("paypal")) return "PayPal";
  if (lastMsg.includes("crypto") || lastMsg.includes("usdt") || lastMsg.includes("btc") || lastMsg.includes("eth") || lastMsg.includes("txid") || title.includes("crypto")) return "Crypto";
  if (lastMsg.includes("card") || lastMsg.includes("cash app") || lastMsg.includes("apple pay") || title.includes("card")) return "Card";
  if (lastMsg.includes("others") || lastMsg.includes("payoneer") || lastMsg.includes("alipay")) return "Others";
  return null;
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
  
  // Archiving state
  const [customerView, setCustomerView] = useState<"active" | "archived">("active");
  const [archivedUserIds, setArchivedUserIds] = useState<string[]>([]);

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

  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const adminTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const adminTypingActiveRef = useRef(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const autoSelectedRef = useRef(false);

  // Admin session for Get Assigned feature
  const { data: session } = useSession();
  const adminUsername = (session?.user as any)?.username || session?.user?.name || session?.user?.email || "Admin";
  const adminId = (session?.user as any)?.id || "";
  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";

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

  const [isAuthReady, setIsAuthReady] = useState(false);

  // 0. Client-side custom token sign-in to Firestore rules
  useEffect(() => {
    if (!clientAuth || !adminId) {
      setIsAuthReady(false);
      return;
    }

    // Skip if already signed in as the correct user
    if (clientAuth.currentUser?.uid === adminId) {
      setIsAuthReady(true);
      return;
    }

    getFirebaseCustomToken().then((res) => {
      if (res.success && res.customToken) {
        signInWithCustomToken(clientAuth, res.customToken)
          .then(() => {
            console.log("Firebase Auth signed in as Admin successfully.");
            setIsAuthReady(true);
          })
          .catch((err) => {
            console.error("Firebase admin custom token auth error:", err);
            setIsAuthReady(false);
          });
      } else {
        setIsAuthReady(false);
      }
    }).catch(() => {
      setIsAuthReady(false);
    });
  }, [adminId]);

  const playSound = useCallback((ref: React.RefObject<HTMLAudioElement | null>) => {
    try {
      if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
    } catch { /* silent */ }
  }, []);

  // Listen for archived users in Firestore
  useEffect(() => {
    if (!isAuthReady) return;
    const db = getDb();
    const archivedRef = collection(db, "archivedChatUsers");

    const unsub = onSnapshot(archivedRef, (snap) => {
      const ids = snap.docs.map((d) => d.id);
      setArchivedUserIds(ids);
    }, (error) => {
      console.warn("[AdminChatPanel] Archived users listener warning:", error.message);
    });

    return unsub;
  }, [isAuthReady]);

  // 1. Listen for all support & order chats in Firestore
  useEffect(() => {
    if (!isAuthReady) return;
    const db = getDb();
    const chatsRef = collection(db, "supportChats");

    const unsub = onSnapshot(chatsRef, (snap) => {
      const list: ChatMeta[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // Sort by last active timestamp
      list.sort((a, b) => {
        const tA = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate().getTime() : a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tB = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate().getTime() : b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tB - tA;
      });

      setConversations(list);

      // Auto-unarchive users if they send a new message (unreadByAdmin > 0)
      list.forEach((conv) => {
        const uId = conv.userId || conv.id;
        if (conv.unreadByAdmin > 0 && archivedUserIds.includes(uId)) {
          deleteDoc(doc(db, "archivedChatUsers", uId)).catch(() => {});
        }
      });

      // Auto-select user if query param is passed
      if (!autoSelectedRef.current && queryUserId) {
        autoSelectedRef.current = true;
        setSelectedUserId(queryUserId);
      }
    }, (error) => {
      console.warn("[AdminChatPanel] Firestore conversations listener warning:", error.message);
    });

    return unsub;
  }, [isAuthReady, queryUserId, archivedUserIds]);

  const handleArchiveUser = async (targetUserId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthReady || !targetUserId) return;
    try {
      const db = getDb();
      await setDoc(doc(db, "archivedChatUsers", targetUserId), {
        userId: targetUserId,
        archivedAt: serverTimestamp(),
        archivedBy: adminUsername,
      });
    } catch (err) {
      console.error("Failed to archive user:", err);
    }
  };

  const handleUnarchiveUser = async (targetUserId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthReady || !targetUserId) return;
    try {
      const db = getDb();
      await deleteDoc(doc(db, "archivedChatUsers", targetUserId));
    } catch (err) {
      console.error("Failed to unarchive user:", err);
    }
  };

  // 2. Listen for messages in active chat & mark unreadByAdmin = 0
  useEffect(() => {
    if (!activeChatId || !isAuthReady) {
      setActiveChat(null);
      setMessages([]);
      return;
    }

    const currentMeta = conversations.find((c) => c.id === activeChatId) || null;
    setActiveChat(currentMeta);

    const db = getDb();
    const msgsRef = collection(db, "supportChats", activeChatId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const msgs: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      // Sound notification on incoming user message
      if (prevMessagesRef.current.length > 0 && msgs.length > prevMessagesRef.current.length) {
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg.sender === "user") {
          playSound(receiveSoundRef);
        }
      }
      prevMessagesRef.current = msgs;
      setMessages(msgs);

      // Reset unread count for admin & mark user messages as read
      const chatRef = doc(db, "supportChats", activeChatId);
      updateDoc(chatRef, { unreadByAdmin: 0 }).catch(() => {});

      // Real-time mark user messages as read: true
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.sender === "user" && !data.read) {
          updateDoc(d.ref, { read: true }).catch(() => {});
        }
      });
    }, (error) => {
      console.warn("[AdminChatPanel] Firestore messages listener warning:", error.message);
    });

    return unsub;
  }, [activeChatId, isAuthReady, conversations, playSound]);

  // 3. Listen for User typing state (RTDB + Firestore) & User online presence in RTDB
  useEffect(() => {
    if (!activeChatId || !isAuthReady) {
      setIsUserTyping(false);
      setIsUserOnline(false);
      return;
    }

    let rtdbTypingActive = false;
    let firestoreTypingActive = false;
    let fallbackTimer: NodeJS.Timeout | null = null;

    const updateTypingStatus = () => {
      const active = rtdbTypingActive || firestoreTypingActive;
      setIsUserTyping(active);
      if (active) {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(() => {
          setIsUserTyping(false);
        }, 3500);
      }
    };

    const db = getDb();
    const chatDocRef = doc(db, "supportChats", activeChatId);
    
    // Realtime Firestore snapshot for User typing
    const unsubDoc = onSnapshot(chatDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        firestoreTypingActive = data?.userTyping === true;
      } else {
        firestoreTypingActive = false;
      }
      updateTypingStatus();
    });

    // RTDB presence & typing listener
    const rtdb = database || (clientAuth ? getDatabase(clientAuth.app) : null);
    let unsubPresence = () => {};
    let unsubRTDBTyping = () => {};

    if (rtdb) {
      const userTypingRef = ref(rtdb, `chatTyping/${activeChatId}/user`);
      unsubRTDBTyping = onValue(userTypingRef, (snap) => {
        const val = snap.val();
        rtdbTypingActive = val?.isTyping === true;
        updateTypingStatus();
      });

      const presenceRef = ref(rtdb, "presence");
      unsubPresence = onValue(presenceRef, (snap) => {
        const data = snap.val();
        if (!data) {
          setIsUserOnline(false);
          return;
        }
        const now = Date.now();
        const isOnline = Object.values(data).some((v: any) => {
          const matchUser = selectedUserId && (v.userId === selectedUserId || v.visitorId === selectedUserId || v.presenceKey?.includes(selectedUserId));
          return matchUser && v.lastSeen && now - v.lastSeen < 35000;
        });
        setIsUserOnline(isOnline);
      });
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      unsubDoc();
      unsubRTDBTyping();
      unsubPresence();
    };
  }, [activeChatId, isAuthReady, selectedUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isUserTyping]);

  const handleAssign = async () => {
    if (!activeChatId) return;
    try {
      const db = getDb();
      const chatRef = doc(db, "supportChats", activeChatId);
      await updateDoc(chatRef, {
        assignedAdminId: adminId,
        assignedAdminName: adminUsername,
      });

      const msgsRef = collection(db, "supportChats", activeChatId, "messages");
      await addDoc(msgsRef, {
        text: `System: ${adminUsername} is now handling this ticket.`,
        sender: "admin",
        senderName: adminUsername,
        timestamp: serverTimestamp(),
        read: false,
      });
    } catch (err) {
      console.error("Failed to assign admin:", err);
    }
  };

  const handleClearChat = async () => {
    if (!activeChatId) return;
    if (!confirm("Are you sure you want to close and clear this ticket? All messages and attachments will be permanently deleted from Firestore.")) {
      return;
    }
    setIsClearing(true);
    try {
      const db = getDb();

      // 1. Delete stored images from Cloudinary
      const imageUrls = messages.map((m) => m.image).filter(Boolean) as string[];
      await deleteChatImages(imageUrls);

      // 2. Fetch and delete all message subcollection docs
      const msgsRef = collection(db, "supportChats", activeChatId, "messages");
      const snap = await getDocs(msgsRef);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 3. Mark parent chat doc as status: "closed"
      const chatRef = doc(db, "supportChats", activeChatId);
      await updateDoc(chatRef, {
        status: "closed",
        lastMessage: "🔒 Ticket closed and cleared by Admin",
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: 0,
        unreadByUser: 0,
      });

      // 4. Add system closure note
      await addDoc(msgsRef, {
        text: "System: This support ticket has been officially closed and cleared by the administration.",
        sender: "admin",
        senderName: "System",
        timestamp: serverTimestamp(),
        read: true,
      });

      alert("Chat cleared and closed successfully.");
    } catch (err) {
      console.error("Error clearing chat:", err);
      alert("Failed to clear chat. Please try again.");
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
        alert(res.error || "Failed to upload image.");
        setIsUploadingImage(false);
        return;
      }

      const imageUrl = res.url;
      const db = getDb();
      const msgsRef = collection(db, "supportChats", activeChatId, "messages");
      const chatRef = doc(db, "supportChats", activeChatId);

      await addDoc(msgsRef, {
        image: imageUrl,
        text: replyText.trim() || undefined,
        sender: "admin",
        senderName: adminUsername,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(chatRef, {
        lastMessage: "📷 Image attached",
        lastMessageAt: serverTimestamp(),
        unreadByUser: increment(1),
        unreadByAdmin: 0,
        adminTyping: false,
      });

      setReplyText("");
      playSound(sendSoundRef);
    } catch (err) {
      console.error("Admin image upload error:", err);
      alert("Error sending image.");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDownloadPDF = () => {
    if (!messages.length || !activeChat) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chat Transcript - ${activeChat.title || "Support Thread"}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #111; }
            h2 { border-bottom: 2px solid #6133e1; padding-bottom: 8px; color: #6133e1; }
            .meta { margin-bottom: 20px; font-size: 13px; color: #555; }
            .msg { margin-bottom: 12px; padding: 10px 14px; border-radius: 8px; max-width: 80%; font-size: 13px; line-height: 1.4; }
            .admin { background: #f0ebff; border-left: 4px solid #6133e1; margin-left: auto; }
            .user { background: #f4f4f5; border-left: 4px solid #71717a; margin-right: auto; }
            .system { background: #fffbeb; border: 1px solid #fef3c7; text-align: center; margin: 10px auto; width: 90%; }
            .sender { font-weight: bold; font-size: 11px; margin-bottom: 4px; display: block; }
            .time { font-size: 10px; color: #888; float: right; }
            img { max-width: 200px; border-radius: 6px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <h2>Chat Transcript: ${activeChat.title || "Support Thread"}</h2>
          <div class="meta">
            <p><strong>Customer:</strong> ${selectedUser?.username || activeChat.username} (${selectedUser?.email || activeChat.email})</p>
            <p><strong>Date Exported:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <hr />
          <div style="margin-top: 20px;">
            ${messages
              .map((m) => {
                const isSys = m.text?.startsWith("System:");
                const text = isSys ? m.text?.replace("System:", "").trim() : m.text;
                const cls = isSys ? "system" : m.sender === "admin" ? "admin" : "user";
                const timeStr = formatMessageTime(m.timestamp);
                return `
                  <div class="msg ${cls}">
                    <span class="time">${timeStr}</span>
                    <span class="sender">${m.senderName} (${m.sender.toUpperCase()})</span>
                    <div>${text || ""}</div>
                    ${m.image ? `<img src="${m.image}" />` : ""}
                  </div>
                `;
              })
              .join("")}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeChatId || isSending || !isAuthReady) return;
    const text = replyText.trim();
    setReplyText("");
    setIsSending(true);

    adminTypingActiveRef.current = false;
    if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);

    const rtdb = database || (clientAuth ? getDatabase(clientAuth.app) : null);
    if (rtdb) {
      remove(ref(rtdb, `chatTyping/${activeChatId}/admin`)).catch(() => {});
    }

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
        adminTyping: false,
      });

      playSound(sendSoundRef);
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCreateDirectUserTicket = async () => {
    if (!selectedUserId) {
      alert("Please select a user from the customers panel first.");
      return;
    }
    const username = selectedUser?.username || "Customer";
    const email = selectedUser?.email || "";

    try {
      const db = getDb();
      const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const ticketId = `support-${randomId}`;
      const chatRef = doc(db, "supportChats", ticketId);

      await setDoc(chatRef, {
        userId: selectedUserId,
        username,
        email,
        type: "support",
        ticketId,
        title: `Direct Ticket #${randomId}`,
        lastMessage: "Direct support ticket opened by Admin.",
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: 0,
        unreadByUser: 1,
        createdAt: serverTimestamp(),
        assignedAdminId: adminId,
        assignedAdminName: adminUsername,
      });

      const msgsRef = collection(db, "supportChats", ticketId, "messages");
      await addDoc(msgsRef, {
        text: `System: Administrator ${adminUsername} opened a direct support thread with you. Please write your questions below.`,
        sender: "admin",
        senderName: adminUsername,
        timestamp: serverTimestamp(),
        read: false,
      });

      setActiveChatId(ticketId);
      setActiveCategoryTab("support");
    } catch (err: any) {
      console.error("Failed to open ticket for user:", err);
      alert("Error creating ticket: " + (err.message || "Please try again."));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);

    if (!activeChatId || !isAuthReady) return;
    const db = getDb();
    const chatRef = doc(db, "supportChats", activeChatId);
    const rtdb = database || (clientAuth ? getDatabase(clientAuth.app) : null);

    if (val.trim().length > 0) {
      if (!adminTypingActiveRef.current) {
        adminTypingActiveRef.current = true;
        updateDoc(chatRef, { adminTyping: true, adminTypingAt: Date.now() }).catch(() => {});
      }

      if (rtdb) {
        const adminTypingRef = ref(rtdb, `chatTyping/${activeChatId}/admin`);
        set(adminTypingRef, { isTyping: true, name: adminUsername, timestamp: Date.now() }).catch(() => {});
        onDisconnect(adminTypingRef).remove().catch(() => {});
      }

      if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
      adminTypingTimeoutRef.current = setTimeout(() => {
        adminTypingActiveRef.current = false;
        updateDoc(chatRef, { adminTyping: false }).catch(() => {});
        if (rtdb) {
          remove(ref(rtdb, `chatTyping/${activeChatId}/admin`)).catch(() => {});
        }
      }, 2500);
    } else {
      adminTypingActiveRef.current = false;
      if (adminTypingTimeoutRef.current) clearTimeout(adminTypingTimeoutRef.current);
      updateDoc(chatRef, { adminTyping: false }).catch(() => {});
      if (rtdb) {
        remove(ref(rtdb, `chatTyping/${activeChatId}/admin`)).catch(() => {});
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  // Ensure user from query param exists in uniqueUsers list
  if (queryUserId && !uniqueUsers.some((u) => u.userId === queryUserId)) {
    const syntheticId = `support-${queryUserId}`;
    uniqueUsers.unshift({
      userId: queryUserId,
      username: queryUsername || "User",
      email: queryEmail || "",
      lastMessageAt: new Date(),
      lastMessage: "Start a conversation",
      unreadCount: 0,
      chats: [
        {
          id: syntheticId,
          userId: queryUserId,
          username: queryUsername || "User",
          email: queryEmail || "",
          lastMessage: "",
          lastMessageAt: new Date(),
          unreadByAdmin: 0,
          unreadByUser: 0,
          type: "support",
          title: "Support Ticket",
        },
      ],
    });
  }

  // Filter unique users by search query
  const filteredUsers = searchQuery.trim()
    ? uniqueUsers.filter(
        (u) =>
          u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : uniqueUsers;

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadByAdmin ?? 0), 0);

  const activeUsers = filteredUsers.filter((u) => !archivedUserIds.includes(u.userId));
  const archivedUsers = filteredUsers.filter((u) => archivedUserIds.includes(u.userId));
  const displayedUsers = customerView === "active" ? activeUsers : archivedUsers;

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
    <div className="flex flex-1 min-h-0 rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0c0c10] shadow-xl h-[640px] md:h-[720px]">
      
      {/* PANE 1: Unique Users List */}
      <div className={cn(
        "w-full md:w-80 shrink-0 flex flex-col border-r border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/40 dark:bg-[#0d0d12] h-full",
        selectedUserId ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-white/[0.08] space-y-3 bg-white dark:bg-[#0d0d12]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-[#6133e1]/10 text-[#6133e1] flex items-center justify-center font-bold text-xs">
                <Headset className="h-4 w-4 text-[#6133e1]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white leading-none flex items-center gap-1.5">
                  Support Desk
                  {isSuperAdmin && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                      SUPER ADMIN
                    </span>
                  )}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{uniqueUsers.length} customer{uniqueUsers.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>

          {/* Active vs Archives Top Segment Control */}
          <div className="flex p-0.5 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setCustomerView("active")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                customerView === "active"
                  ? "bg-white dark:bg-[#181820] text-zinc-900 dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <span>Active ({activeUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCustomerView("archived")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                customerView === "archived"
                  ? "bg-white dark:bg-[#181820] text-zinc-900 dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <Archive className="h-3.5 w-3.5 text-amber-500" />
              <span>Archives ({archivedUsers.length})</span>
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              id="admin-chat-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer or email…"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-100 dark:bg-[#181820] border border-zinc-200/80 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-[#6133e1] dark:focus:border-[#6133e1] focus:ring-2 focus:ring-[#6133e1]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* User list content */}
        <div className="flex-1 overflow-y-auto">
          {displayedUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
              <Users className="h-8 w-8 text-zinc-350 dark:text-zinc-650" />
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {searchQuery 
                  ? "No matching customers found" 
                  : customerView === "archived" 
                  ? "No archived customer threads" 
                  : "No active customer threads"}
              </p>
            </div>
          )}

          {displayedUsers.map((u) => (
            <button
              key={u.userId}
              onClick={() => {
                setSelectedUserId(u.userId);
                setActiveChatId(null); // Reset active thread
              }}
              className={cn(
                "w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-white/[0.03] hover:bg-zinc-100/70 dark:hover:bg-white/[0.03] transition cursor-pointer flex items-center justify-between gap-3 group/row",
                selectedUserId === u.userId ? "bg-[#6133e1]/5 dark:bg-[#6133e1]/10 border-l-4 border-l-[#6133e1]" : ""
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="h-9 w-9 shrink-0 rounded-xl bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-center text-zinc-900 dark:text-white text-xs font-bold uppercase">
                  {(u.username || u.email || "?")[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                    {u.username || "Unknown"}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate leading-tight mt-0.5">{u.email}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate mt-1">
                    {u.lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">{formatTime(u.lastMessageAt)}</span>
                  {customerView === "active" ? (
                    <span
                      onClick={(e) => handleArchiveUser(u.userId, e)}
                      className="p-1 rounded-md text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 opacity-0 group-hover/row:opacity-100 transition cursor-pointer"
                      title="Archive Customer"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </span>
                  ) : (
                    <span
                      onClick={(e) => handleUnarchiveUser(u.userId, e)}
                      className="p-1 rounded-md text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
                      title="Unarchive Customer"
                    >
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                {u.unreadCount > 0 && (
                  <span className="h-4.5 min-w-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
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
        "w-full md:w-72 shrink-0 flex flex-col border-r border-zinc-200/80 dark:border-white/[0.08] bg-zinc-50/20 dark:bg-[#0d0d12] h-full",
        !selectedUserId ? "hidden md:flex" : activeChatId ? "hidden md:flex" : "flex"
      )}>
        {/* Header with back button */}
        <div className="p-4 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0d0d12] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setSelectedUserId(null)}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition"
              title="Back to Customers"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                @{selectedUser?.username || "Customer Chats"}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-none mt-0.5">
                Support & Order Threads
              </p>
            </div>
          </div>

          {selectedUserId && (
            archivedUserIds.includes(selectedUserId) ? (
              <button
                type="button"
                onClick={(e) => handleUnarchiveUser(selectedUserId, e)}
                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border border-emerald-500/20 shrink-0"
                title="Unarchive Customer"
              >
                <ArchiveRestore className="h-3 w-3" />
                <span>Unarchive</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => handleArchiveUser(selectedUserId, e)}
                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer border border-amber-500/20 shrink-0"
                title="Archive Customer"
              >
                <Archive className="h-3 w-3" />
                <span>Archive</span>
              </button>
            )
          )}
        </div>

        {/* Super Admin Open Direct Ticket Action */}
        {isSuperAdmin && selectedUserId && (
          <div className="p-3 border-b border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0d0d12] shrink-0">
            <button
              type="button"
              onClick={handleCreateDirectUserTicket}
              className="w-full h-8.5 flex items-center justify-center gap-1.5 bg-[#6133e1] hover:bg-[#5028c7] text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Open Direct Support Ticket</span>
            </button>
          </div>
        )}

        {/* Support & Orders Tabs (Tactile Segmented Control) */}
        <div className="p-3 bg-white dark:bg-[#0d0d12] border-b border-zinc-200/80 dark:border-white/[0.08] shrink-0">
          <div className="p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] flex gap-1">
            <button
              onClick={() => setActiveCategoryTab("support")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeCategoryTab === "support"
                  ? "bg-white dark:bg-[#181820] text-zinc-900 dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#6133e1]" />
              <span>Support ({userSupportChats.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryTab("orders")}
              className={cn(
                "flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                activeCategoryTab === "orders"
                  ? "bg-white dark:bg-[#181820] text-zinc-900 dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
              <span>Orders ({userOrderChats.length})</span>
            </button>
          </div>
        </div>

        {/* List of active category's chats */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeCategoryList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
                No active threads in this category
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
                  "w-full text-left p-3 rounded-xl transition-all border cursor-pointer flex items-center justify-between gap-2",
                  activeChatId === conv.id
                    ? "bg-[#6133e1]/5 border-[#6133e1]/20 dark:border-[#6133e1]/30 shadow-2xs"
                    : "hover:bg-zinc-100/70 dark:hover:bg-white/[0.04] border-transparent"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {conv.title || "Chat Thread"}
                      </span>
                      {isSuperAdmin && activeCategoryTab === "orders" && (() => {
                        const method = getPaymentMethod(conv);
                        if (!method) return null;
                        const colors: Record<string, string> = {
                          UPI: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                          Wise: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                          PayPal: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                          Crypto: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                          Card: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                          Others: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
                        };
                        return (
                          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border leading-none shrink-0", colors[method] || colors.Others)}>
                            {method}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-normal flex-1">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                    {conv.unreadByAdmin > 0 && (
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0 ml-1" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* PANE 3: Chat Thread */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 h-full bg-white dark:bg-[#0c0c10]",
        !activeChatId ? "hidden md:flex" : "flex"
      )}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 bg-zinc-50/30 dark:bg-[#0c0c10]">
            <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-center text-zinc-400 shadow-xs">
              <MessageCircle className="h-7 w-7 text-[#6133e1]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">No Chat Selected</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
                {selectedUserId 
                  ? "Select a support ticket or order coordination thread from the center panel to begin."
                  : "Choose a customer from the left panel to inspect their active support chats."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center gap-3 bg-white dark:bg-[#0d0d12] shrink-0">
              <button
                type="button"
                onClick={() => { setActiveChatId(null); }}
                className="md:hidden mr-1 p-1 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                    {activeChat?.type === "order" ? (
                      <ShoppingBag className="h-4 w-4 text-blue-500 shrink-0" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-[#6133e1] shrink-0" />
                    )}
                    <span className="truncate">{activeChat?.title || "Live Chat"}</span>
                  </h3>
                  {activeChat?.type === "order" ? (
                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded text-[9px] font-bold border border-blue-500/20">Order</span>
                  ) : (
                    <span className="bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 px-1.5 py-0.2 rounded text-[9px] font-bold border border-[#6133e1]/20">Support</span>
                  )}
                  {activeChat?.type === "order" && isSuperAdmin && (() => {
                    const method = getPaymentMethod(activeChat);
                    if (!method) return null;
                    const colors: Record<string, string> = {
                      UPI: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                      Wise: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                      PayPal: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                      Crypto: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      Card: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
                      Others: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
                    };
                    return (
                      <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-bold border", colors[method] || colors.Others)}>
                        {method}
                      </span>
                    );
                  })()}
                </div>
                {isUserTyping ? (
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 font-semibold animate-pulse leading-none mt-0.5">
                    {selectedUser?.username || "User"} is typing...
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-none mt-0.5 truncate">
                    {selectedUser?.username} · {selectedUser?.email}
                  </p>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                  title="Download Chat as PDF"
                >
                  <FileDown className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Export PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={activeChat?.status === "closed" || isClearing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition cursor-pointer disabled:opacity-40 border border-red-500/20"
                  title="Close & Clear Ticket"
                >
                  {isClearing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  <span>{activeChat?.status === "closed" ? "Closed" : "Clear Ticket"}</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/30 dark:bg-[#0d0d12] min-h-[220px]">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">No messages yet in this thread.</p>
                </div>
              )}

              {messages.map((msg) => {
                const isSystem = msg.text?.startsWith("System:") ?? false;
                const displayMsg = isSystem ? msg.text?.replace("System:", "").trim() : msg.text;
                
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1 max-w-full",
                      isSystem
                        ? "items-center"
                        : msg.sender === "admin"
                        ? "items-end"
                        : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] sm:max-w-[78%] px-4 py-2.5 text-xs leading-relaxed border select-text break-words [word-break:break-word] overflow-hidden rounded-2xl",
                        isSystem
                          ? "bg-zinc-100 dark:bg-[#18181c] border-zinc-200/80 dark:border-white/[0.06] text-zinc-600 dark:text-zinc-400 text-center rounded-xl font-medium max-w-[90%]"
                          : msg.sender === "admin"
                          ? "bg-[#6133e1] text-white border-[#6133e1] rounded-tr-xs shadow-xs font-medium"
                          : "bg-white text-zinc-900 dark:bg-[#1c1c20] dark:text-zinc-100 border-zinc-200 dark:border-white/[0.08] rounded-tl-xs shadow-xs"
                      )}
                    >
                      {msg.image && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-white/10 max-w-full shadow-xs">
                          <img
                            src={msg.image}
                            alt={msg.text || "Attached Image"}
                            className="max-h-48 object-contain w-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.image, "_blank")}
                          />
                        </div>
                      )}
                      {displayMsg && <p className="whitespace-pre-wrap break-words [word-break:break-word] max-w-full overflow-hidden leading-relaxed">{displayMsg}</p>}
                    </div>
                    <div className="flex items-center gap-1 px-1 select-none text-[10px] text-zinc-400 font-medium">
                      <span>
                        {isSystem ? "System" : msg.sender === "user" ? (selectedUser?.username || "User") : "You"} · {formatMessageTime(msg.timestamp)}
                      </span>
                      {msg.sender === "admin" && !isSystem && (
                        <span className="inline-flex items-center ml-0.5">
                          {msg.read ? (
                            <span title="Read"><CheckCheck className="h-3.5 w-3.5 text-sky-400 stroke-[2.5]" /></span>
                          ) : isUserOnline ? (
                            <span title="Delivered"><CheckCheck className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 stroke-[2]" /></span>
                          ) : (
                            <span title="Sent"><Check className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 stroke-[2]" /></span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {isUserTyping && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1c1c20] border border-zinc-200 dark:border-white/[0.08] rounded-2xl rounded-tl-xs text-xs font-medium text-zinc-600 dark:text-zinc-300 shadow-xs w-max animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-zinc-500">{selectedUser?.username || "User"} is typing</span>
                  <span className="flex items-center gap-0.5 ml-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6133e1] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6133e1] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6133e1] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              )}
            </div>

            {/* Reply Input (Bigger WhatsApp Style Container) */}
            <div className="p-3.5 sm:p-4 border-t border-zinc-200/80 dark:border-white/[0.08] bg-zinc-100/70 dark:bg-[#121216] shrink-0">
              {activeChat?.status === "closed" ? (
                <div className="flex items-center justify-center p-3 rounded-2xl bg-zinc-200/60 dark:bg-white/[0.04] border border-zinc-300/60 dark:border-white/[0.06] text-zinc-500 text-xs font-semibold">
                  🔒 This chat has been closed and cleared
                </div>
              ) : !activeChat?.assignedAdminId ? (
                /* No one assigned yet — show Get Assigned button */
                <div className="flex flex-col items-center gap-2 py-2">
                  <p className="text-xs text-zinc-500 font-medium">No admin is assigned to this chat yet.</p>
                  <button
                    type="button"
                    onClick={handleAssign}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-md"
                  >
                    ✋ Get Assigned
                  </button>
                </div>
              ) : (
                /* Someone is assigned */
                <div className="flex flex-col gap-2.5">
                  {/* Assignment banner */}
                  <div className={cn(
                    "flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium border",
                    activeChat.assignedAdminId === adminId
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                  )}>
                    <span>
                      {activeChat.assignedAdminId === adminId
                        ? `✅ You are handling this ticket`
                        : `⚡ ${activeChat.assignedAdminName} is handling this ticket`}
                    </span>
                    {activeChat.assignedAdminId !== adminId && (
                      <button
                        type="button"
                        onClick={handleAssign}
                        className="ml-2 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        Take Over
                      </button>
                    )}
                  </div>

                  {/* Reply input — all admins can send */}
                  <div className="flex items-end gap-2.5">
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
                      className="h-11 w-11 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a20] text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/[0.06] flex items-center justify-center transition cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
                      title="Attach Image"
                    >
                      {isUploadingImage ? (
                        <Loader2 className="h-5 w-5 animate-spin text-zinc-900 dark:text-white" />
                      ) : (
                        <ImageIcon className="h-5 w-5" />
                      )}
                    </button>
                    <textarea
                      ref={inputRef}
                      id="admin-chat-reply-input"
                      rows={2}
                      value={replyText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={`Reply to ${selectedUser?.username || "user"}… (Shift + Enter for new line)`}
                      disabled={isSending || isUploadingImage}
                      className="flex-1 bg-white dark:bg-[#1b1b20] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-2xl px-4 py-3 text-xs sm:text-sm outline-none border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-white/30 transition-all resize-none max-h-40 min-h-[50px] leading-relaxed disabled:opacity-50 break-words [word-break:break-word] shadow-xs"
                    />
                    <button
                      id="admin-chat-reply-send"
                      onClick={handleSendReply}
                      disabled={(!replyText.trim() && !isUploadingImage) || isSending || isUploadingImage}
                      className="h-11 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 font-bold text-xs shadow-md"
                      aria-label="Send reply"
                    >
                      {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
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
