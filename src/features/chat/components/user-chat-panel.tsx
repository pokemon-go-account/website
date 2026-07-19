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
  Check,
  CheckCheck,
  Sparkles,
  Inbox,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChatImage, getFirebaseCustomToken } from "@/features/chat/actions";
import { signInWithCustomToken } from "firebase/auth";
import { auth as clientAuth, database, app as clientApp } from "@/lib/firebase";
import { ref, set, remove, onValue, onDisconnect, getDatabase } from "firebase/database";

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
  read?: boolean;
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
  const userId = (session?.user as any)?.id as string | undefined;
  const username =
    (session?.user as any)?.username ||
    session?.user?.name ||
    session?.user?.email ||
    "User";
  const [activeTab, setActiveTab] = useState<"support" | "orders">("support");
  const [conversations, setConversations] = useState<ChatMeta[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(initialChatId);
  const [activeChat, setActiveChat] = useState<ChatMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);

  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingActiveRef = useRef(false);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Sound effects
  const sendSoundRef = useRef<HTMLAudioElement | null>(null);
  const receiveSoundRef = useRef<HTMLAudioElement | null>(null);
  const notifSoundRef = useRef<HTMLAudioElement | null>(null);
  const prevMessagesRef = useRef<Message[]>([]);
  const prevConversationsRef = useRef<ChatMeta[]>([]);

  useEffect(() => {
    sendSoundRef.current = new Audio("/audio/custom-whatsapp-chat-animation_X8t2FkCu.mp3");
    receiveSoundRef.current = new Audio("/audio/custom-whatsapp-chat-animation_qyWzqrX9.mp3");
    notifSoundRef.current = new Audio("/audio/sound-7(1).mp3");
    [sendSoundRef, receiveSoundRef, notifSoundRef].forEach((r) => {
      if (r.current) { r.current.preload = "auto"; r.current.volume = 0.6; }
    });
  }, []);

  const [isAuthReady, setIsAuthReady] = useState(false);

  // 0. Client-side custom token sign-in to Firestore rules
  useEffect(() => {
    if (!clientAuth || !userId) {
      setIsAuthReady(false);
      return;
    }

    // Skip if already signed in as the correct user
    if (clientAuth.currentUser?.uid === userId) {
      setIsAuthReady(true);
      return;
    }

    getFirebaseCustomToken().then((res) => {
      if (res.success && res.customToken) {
        signInWithCustomToken(clientAuth, res.customToken)
          .then(() => {
            console.log("Firebase Auth signed in with custom token successfully.");
            setIsAuthReady(true);
          })
          .catch((err) => {
            console.error("Firebase custom token auth error:", err);
            setIsAuthReady(false);
          });
      } else {
        setIsAuthReady(false);
      }
    }).catch(() => {
      setIsAuthReady(false);
    });
  }, [userId]);

  const playSound = useCallback((ref: React.RefObject<HTMLAudioElement | null>) => {
    try {
      if (ref.current) {
        ref.current.currentTime = 0;
        ref.current.play().catch(() => {});
      }
    } catch { /* silent fail */ }
  }, []);

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
        text: inputText.trim() || undefined,
        sender: "user",
        senderName: username,
        timestamp: serverTimestamp(),
        read: false,
      });

      await updateDoc(chatRef, {
        lastMessage: "📷 Image attached",
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: increment(1),
        userTyping: false,
      });

      setInputText("");
      playSound(sendSoundRef);
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Error sending image.");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // 1. Listen for user's support/order chats
  useEffect(() => {
    if (!userId || !isAuthReady) return;
    const db = getDb();
    const chatsRef = collection(db, "supportChats");
    const q = query(chatsRef, where("userId", "==", userId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: ChatMeta[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        list.sort((a, b) => {
          const tA = a.lastMessageAt?.toDate
            ? a.lastMessageAt.toDate().getTime()
            : a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;
          const tB = b.lastMessageAt?.toDate
            ? b.lastMessageAt.toDate().getTime()
            : b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;
          return tB - tA;
        });

        // Detect new unread message from admin
        if (prevConversationsRef.current.length > 0) {
          list.forEach((c) => {
            const prev = prevConversationsRef.current.find((p) => p.id === c.id);
            if (prev && c.unreadByUser > prev.unreadByUser && c.id !== activeChatId) {
              playSound(notifSoundRef);
            }
          });
        }

        prevConversationsRef.current = list;
        setConversations(list);

        if (initialChatId && list.some((c) => c.id === initialChatId)) {
          setActiveChatId(initialChatId);
        }
      },
      (error) => {
        console.warn("[UserChatPanel] Firestore conversations listener warning:", error.message);
      }
    );

    return unsub;
  }, [userId, isAuthReady, initialChatId, activeChatId, playSound]);

  // 2. Listen for messages in active chat & mark read
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

    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs: Message[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        // Detect new incoming message from admin
        if (prevMessagesRef.current.length > 0 && msgs.length > prevMessagesRef.current.length) {
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg.sender === "admin") {
            playSound(receiveSoundRef);
          }
        }
        prevMessagesRef.current = msgs;
        setMessages(msgs);

        // Mark unreadByUser as 0 and update unread admin messages to read: true
        if (userId) {
          const chatRef = doc(db, "supportChats", activeChatId);
          updateDoc(chatRef, { unreadByUser: 0 }).catch(() => {});

          // Auto mark admin messages as read in real-time
          snap.docs.forEach((d) => {
            const data = d.data();
            if (data.sender === "admin" && !data.read) {
              updateDoc(d.ref, { read: true }).catch(() => {});
            }
          });
        }
      },
      (error) => {
        console.warn("[UserChatPanel] Firestore messages listener warning:", error.message);
      }
    );

    return unsub;
  }, [activeChatId, isAuthReady, userId, conversations, playSound]);

  // 3. Listen for Admin typing state (RTDB + Firestore) & Admin online presence in RTDB
  useEffect(() => {
    if (!activeChatId || !isAuthReady) {
      setIsAdminTyping(false);
      setIsAdminOnline(false);
      return;
    }

    let rtdbTypingActive = false;
    let firestoreTypingActive = false;
    let fallbackTimer: NodeJS.Timeout | null = null;

    const updateTypingStatus = () => {
      const active = rtdbTypingActive || firestoreTypingActive;
      setIsAdminTyping(active);
      if (active) {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(() => {
          setIsAdminTyping(false);
        }, 3500);
      }
    };

    const db = getDb();
    const chatDocRef = doc(db, "supportChats", activeChatId);
    
    // Realtime Firestore snapshot for Admin typing
    const unsubDoc = onSnapshot(chatDocRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        firestoreTypingActive = data?.adminTyping === true;
      } else {
        firestoreTypingActive = false;
      }
      updateTypingStatus();
    });

    // RTDB presence & typing listener
    const rtdb = database || (clientApp ? getDatabase(clientApp) : null);
    let unsubPresence = () => {};
    let unsubRTDBTyping = () => {};

    if (rtdb) {
      const adminTypingRef = ref(rtdb, `chatTyping/${activeChatId}/admin`);
      unsubRTDBTyping = onValue(adminTypingRef, (snap) => {
        const val = snap.val();
        rtdbTypingActive = val?.isTyping === true;
        updateTypingStatus();
      });

      const presenceRef = ref(rtdb, "presence");
      unsubPresence = onValue(presenceRef, (snap) => {
        const data = snap.val();
        if (!data) {
          setIsAdminOnline(false);
          return;
        }
        const now = Date.now();
        const isAnyAdminOnline = Object.values(data).some((v: any) => {
          const isSuperAdmin = v.userId && (v.presenceKey?.startsWith("u_") || v.userId);
          return isSuperAdmin && v.lastSeen && now - v.lastSeen < 35000;
        });
        setIsAdminOnline(isAnyAdminOnline);
      });
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      unsubDoc();
      unsubRTDBTyping();
      unsubPresence();
    };
  }, [activeChatId, isAuthReady]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAdminTyping]);

  // Handle creating a new general support ticket
  const handleCreateTicket = async () => {
    if (!userId || isCreatingTicket || !isAuthReady) return;
    setIsCreatingTicket(true);

    try {
      const db = getDb();
      const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const ticketId = `support-${randomId}`;
      const chatRef = doc(db, "supportChats", ticketId);

      await setDoc(chatRef, {
        userId,
        username,
        email: session?.user?.email ?? "",
        type: "support",
        ticketId,
        title: `Support Ticket #${randomId}`,
        lastMessage: "Ticket opened. Type your query below.",
        lastMessageAt: serverTimestamp(),
        unreadByAdmin: 1,
        unreadByUser: 0,
        createdAt: serverTimestamp(),
      });

      const msgsRef = collection(db, "supportChats", ticketId, "messages");
      await addDoc(msgsRef, {
        text: `System: Support ticket #${randomId} opened. Someone from our support team will reply shortly.`,
        sender: "admin",
        senderName: "Support Team",
        timestamp: serverTimestamp(),
        read: false,
      });

      setActiveChatId(ticketId);
      setActiveTab("support");
    } catch (err: any) {
      console.error("Failed to create support ticket:", err);
      alert("Error creating ticket: " + (err.message || "Please try again."));
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Handle sending user message
  const handleSend = async () => {
    if (!inputText.trim() || !activeChatId || isSending || !isAuthReady) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);

    isTypingActiveRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const db = getDb();
      const msgsRef = collection(db, "supportChats", activeChatId, "messages");
      const chatRef = doc(db, "supportChats", activeChatId);
      const rtdb = database || (clientApp ? getDatabase(clientApp) : null);

      if (rtdb) {
        remove(ref(rtdb, `chatTyping/${activeChatId}/user`)).catch(() => {});
      }

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
        userTyping: false,
      });

      // Play send sound after message is written
      playSound(sendSoundRef);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    if (!activeChatId || !isAuthReady) return;
    const db = getDb();
    const chatRef = doc(db, "supportChats", activeChatId);
    const rtdb = database || (clientApp ? getDatabase(clientApp) : null);

    if (val.trim().length > 0) {
      if (!isTypingActiveRef.current) {
        isTypingActiveRef.current = true;
        updateDoc(chatRef, { userTyping: true, userTypingAt: Date.now() }).catch(() => {});
      }

      if (rtdb) {
        const userTypingRef = ref(rtdb, `chatTyping/${activeChatId}/user`);
        set(userTypingRef, { isTyping: true, name: username, timestamp: Date.now() }).catch(() => {});
        onDisconnect(userTypingRef).remove().catch(() => {});
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingActiveRef.current = false;
        updateDoc(chatRef, { userTyping: false }).catch(() => {});
        if (rtdb) {
          remove(ref(rtdb, `chatTyping/${activeChatId}/user`)).catch(() => {});
        }
      }, 2500);
    } else {
      isTypingActiveRef.current = false;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      updateDoc(chatRef, { userTyping: false }).catch(() => {});
      if (rtdb) {
        remove(ref(rtdb, `chatTyping/${activeChatId}/user`)).catch(() => {});
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  // Filter lists by tab
  const supportChats = conversations.filter(
    (c) => c.type === "support" || c.id.startsWith("support-")
  );
  const orderChats = conversations.filter(
    (c) => c.type === "order" || c.id.startsWith("order-")
  );

  const activeList = activeTab === "support" ? supportChats : orderChats;

  const supportUnread = supportChats.reduce((acc, c) => acc + (c.unreadByUser ?? 0), 0);
  const ordersUnread = orderChats.reduce((acc, c) => acc + (c.unreadByUser ?? 0), 0);

  // Render list of conversations
  const renderSidebar = () => {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#0d0d12]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200/80 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0d0d12] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 flex items-center justify-center border border-[#6133e1]/20">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">
                Live Support
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-normal">
                Customer Care & Orders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isFullScreen && (
              <button
                onClick={() => {
                  window.location.href = "/chat";
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                title="Expand to Full Screen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                aria-label="Close Chat"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs (Tactile Segmented Control) */}
        <div className="p-3 bg-white dark:bg-[#0d0d12] border-b border-zinc-200/80 dark:border-white/[0.08] shrink-0">
          <div className="p-1 rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] flex gap-1">
            <button
              onClick={() => setActiveTab("support")}
              className={cn(
                "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer relative",
                activeTab === "support"
                  ? "bg-white dark:bg-[#181820] text-zinc-900 dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#6133e1]" />
              <span>Support</span>
              {supportUnread > 0 && (
                <span className="ml-0.5 min-w-[18px] h-4 px-1 rounded-full bg-[#6133e1] text-white text-[10px] font-bold flex items-center justify-center">
                  {supportUnread > 99 ? "99+" : supportUnread}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={cn(
                "flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer relative",
                activeTab === "orders"
                  ? "bg-white dark:bg-[#181820] text-zinc-900 dark:text-white shadow-xs font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
              )}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-blue-500" />
              <span>Orders</span>
              {ordersUnread > 0 && (
                <span className="ml-0.5 min-w-[18px] h-4 px-1 rounded-full bg-[#6133e1] text-white text-[10px] font-bold flex items-center justify-center">
                  {ordersUnread > 99 ? "99+" : ordersUnread}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Action Header */}
        <div className="px-3 py-2 bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-200/80 dark:border-white/[0.08] shrink-0">
          {activeTab === "support" ? (
            <button
              onClick={handleCreateTicket}
              disabled={isCreatingTicket}
              className="w-full h-8 flex items-center justify-center gap-1.5 bg-[#6133e1] hover:bg-[#5028c7] text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isCreatingTicket ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5" />
              )}
              <span>New Support Ticket</span>
            </button>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center font-normal py-0.5">
              Order payment & coordination threads
            </p>
          )}
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {activeList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06] flex items-center justify-center text-zinc-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                No conversation threads yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[220px] leading-relaxed">
                {activeTab === "support"
                  ? "Click above to open a direct support ticket with our team."
                  : "Order chats appear here automatically upon checkout."}
              </p>
            </div>
          ) : (
            activeList.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveChatId(conv.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer border gap-2",
                  activeChatId === conv.id
                    ? "bg-[#6133e1]/5 border-[#6133e1]/20 dark:border-[#6133e1]/30 shadow-2xs"
                    : "hover:bg-zinc-100 dark:hover:bg-white/[0.04] border-transparent"
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                      {conv.title || "Support Thread"}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate font-normal flex-1">
                      {conv.lastMessage || "Click to view chat"}
                    </p>
                    {conv.unreadByUser > 0 && (
                      <span className="h-2 w-2 rounded-full bg-[#6133e1] shrink-0" />
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0 ml-1" />
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
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8 bg-zinc-50/50 dark:bg-[#0c0c10]">
          <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200/80 dark:border-white/[0.06] flex items-center justify-center text-zinc-400 shadow-xs">
            <MessageSquare className="h-6 w-6 text-[#6133e1]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">No Chat Selected</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[240px] leading-relaxed">
              Choose a support ticket or order thread from the list to begin chatting.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col h-full bg-zinc-50/30 dark:bg-[#0d0d12]">
        {/* Thread Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200/80 dark:border-white/[0.08] bg-white dark:bg-[#0d0d12] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back button for compact view */}
            {(!isFullScreen || isMobile) && (
              <button
                onClick={() => setActiveChatId(null)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer mr-0.5"
                title="Back to threads"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5 truncate">
                {activeChat?.type === "order" ? (
                  <ShoppingBag className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-[#6133e1] shrink-0" />
                )}
                <span className="truncate">{activeChat?.title || "Live Chat"}</span>
              </h3>
              {isAdminTyping ? (
                <p className="text-xs text-emerald-500 font-semibold animate-pulse leading-none mt-0.5">
                  Support Team is typing...
                </p>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal leading-none mt-0.5">
                  {activeChat?.type === "order" ? "Order Support & Coordination" : "Dedicated Support Ticket"}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons (Expand / Close) */}
          <div className="flex items-center gap-1">
            {!isFullScreen && (
              <button
                onClick={() => {
                  window.location.href = `/chat?chatId=${activeChatId}`;
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                title="Expand to Full Screen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
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
              <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                No messages yet in this conversation
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
                  "flex flex-col gap-1 max-w-full",
                  isSystem
                    ? "items-center"
                    : msg.sender === "user"
                    ? "items-end"
                    : "items-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] sm:max-w-[78%] rounded-2xl text-xs sm:text-sm leading-relaxed px-4 py-3 select-text break-words [word-break:break-word] overflow-hidden shadow-xs",
                    isSystem
                      ? "bg-zinc-100 dark:bg-[#18181c] text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-white/[0.06] text-center rounded-xl font-medium max-w-[90%]"
                      : msg.sender === "user"
                      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-tr-xs border border-zinc-800 dark:border-white/20 font-medium"
                      : "bg-white text-zinc-900 dark:bg-[#1e1e22] dark:text-zinc-100 border border-zinc-200 dark:border-white/[0.08] rounded-tl-xs"
                  )}
                >
                  {msg.image && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-zinc-200/60 dark:border-white/10 max-w-full shadow-xs">
                      <img
                        src={msg.image}
                        alt={msg.text || "Attached Image"}
                        className="max-h-56 object-contain w-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(msg.image, "_blank")}
                      />
                    </div>
                  )}
                  {displayMsg && <p className="whitespace-pre-wrap break-words [word-break:break-word] max-w-full overflow-hidden leading-relaxed">{displayMsg}</p>}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 px-1 font-medium leading-none">
                  <span>{!isSystem && msg.sender === "admin" ? "Support Team · " : ""}{formatTime(msg.timestamp)}</span>
                  {!isSystem && msg.sender === "user" && (
                    <span className="inline-flex items-center select-none">
                      {msg.read ? (
                        <span title="Read"><CheckCheck className="h-4 w-4 text-[#34B7F1] dark:text-[#34B7F1] stroke-[2.5]" /></span>
                      ) : isAdminOnline ? (
                        <span title="Delivered"><CheckCheck className="h-4 w-4 text-zinc-400 dark:text-zinc-500 stroke-[2]" /></span>
                      ) : (
                        <span title="Sent"><Check className="h-4 w-4 text-zinc-400 dark:text-zinc-500 stroke-[2]" /></span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {isAdminTyping && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1e1e22] border border-zinc-200 dark:border-white/[0.08] rounded-2xl rounded-tl-xs text-xs font-medium text-zinc-600 dark:text-zinc-300 shadow-xs w-max animate-in fade-in zoom-in-95 duration-150">
              <span className="text-zinc-500 font-medium">Support Team is typing</span>
              <span className="flex items-center gap-0.5 ml-1">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          )}
        </div>

        {/* Bigger WhatsApp Style Input Container */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-200/80 dark:border-white/[0.08] bg-zinc-100/70 dark:bg-[#121216] shrink-0">
          {activeChat?.status === "closed" ? (
            <div className="flex items-center justify-center p-3 rounded-2xl bg-zinc-200/60 dark:bg-white/[0.04] border border-zinc-300/60 dark:border-white/[0.06] text-zinc-500 text-xs font-semibold">
              🔒 This ticket has been closed
            </div>
          ) : (
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
                rows={2}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Shift + Enter for new line)"
                disabled={isSending || isUploadingImage}
                className="flex-1 bg-white dark:bg-[#1b1b20] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 rounded-2xl px-4 py-3 text-xs sm:text-sm outline-none border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-white/30 transition-all resize-none max-h-40 min-h-[50px] leading-relaxed disabled:opacity-50 break-words [word-break:break-word] shadow-xs"
              />
              <button
                onClick={handleSend}
                disabled={(!inputText.trim() && !isUploadingImage) || isSending || isUploadingImage}
                className="h-11 w-11 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-md"
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
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
      <div className="flex flex-1 min-h-0 rounded-2xl border border-zinc-200/80 dark:border-white/10 overflow-hidden bg-white dark:bg-[#0c0c10] shadow-xl h-[640px] md:h-[720px]">
        {/* Left sidebar: hidden on mobile if thread is open */}
        <div className={cn(
          "w-full md:w-80 shrink-0 border-r border-zinc-200/80 dark:border-white/[0.08] flex flex-col h-full",
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
    <div className="flex flex-col h-[580px] w-full bg-white dark:bg-[#0d0d12]">
      {activeChatId ? renderThread() : renderSidebar()}
    </div>
  );
}
