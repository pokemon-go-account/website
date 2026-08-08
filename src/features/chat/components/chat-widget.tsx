"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firestore";
import { MessageCircle, MessageSquare, ShoppingBag, X, Sparkles } from "lucide-react";
import { UserChatPanel } from "./user-chat-panel";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { signInWithCustomToken } from "firebase/auth";
import { auth as clientAuth } from "@/lib/firebase";
import { getFirebaseCustomToken } from "@/features/chat/actions";

export function ChatWidget() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeNotification, setActiveNotification] = useState<{
    id: string;
    title: string;
    message: string;
    type: "support" | "order";
    chatId: string;
  } | null>(null);

  const [guestId, setGuestId] = useState<string | null>(null);

  // Initialize persistent guest ID for unauthenticated visitors
  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedId = localStorage.getItem("pogo_guest_chat_id");
      if (!storedId) {
        storedId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem("pogo_guest_chat_id", storedId);
      }
      setGuestId(storedId);
    }
  }, []);

  const rawUserId = (session?.user as any)?.id as string | undefined;
  const userId = rawUserId || guestId || undefined;

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const prevConvsRef = useRef<any[]>([]);
  const isFirstRender = useRef(true);
  const notifSoundRef = useRef<HTMLAudioElement | null>(null);
  const notifiedKeysRef = useRef<Set<string>>(new Set());

  // Initialize notification sound
  useEffect(() => {
    notifSoundRef.current = new Audio("/audio/sound-7(1).mp3");
    if (notifSoundRef.current) {
      notifSoundRef.current.preload = "auto";
      notifSoundRef.current.volume = 0.6;
    }
  }, []);

  // Proactive 1-minute automated support engagement toast (ONLY for UNLOGGED-IN guest visitors, ONCE per person)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // DO NOT send message to logged-in users (ONLY unauthenticated guests)
    if (session?.user) return;

    const nudgeShown = localStorage.getItem("pogo_chat_nudge_shown");
    if (nudgeShown === "true") return;

    const timer = setTimeout(() => {
      localStorage.setItem("pogo_chat_nudge_shown", "true");

      setActiveNotification({
        id: `proactive-nudge-${Date.now()}`,
        title: "24/7 Live Support 👋",
        message: "Need any help? We are here for you 24/7 — feel free to chat with us anytime!",
        type: "support",
        chatId: "proactive-nudge",
      });

      try {
        if (notifSoundRef.current) {
          notifSoundRef.current.currentTime = 0;
          notifSoundRef.current.play().catch(() => {});
        }
      } catch { /* silent */ }
    }, 60000); // 60 seconds (1 minute)

    return () => clearTimeout(timer);
  }, [session?.user]);

  // Mark nudge shown if user opens chat widget manually
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      localStorage.setItem("pogo_chat_nudge_shown", "true");
    }
  }, [isOpen]);

  // Sign in to Firebase Auth using NextAuth session ID for logged in users
  useEffect(() => {
    if (!rawUserId) {
      setIsAuthReady(true);
      return;
    }
    if (!clientAuth) {
      setIsAuthReady(false);
      return;
    }

    if (clientAuth.currentUser?.uid === rawUserId) {
      setIsAuthReady(true);
      return;
    }

    getFirebaseCustomToken().then((res) => {
      if (res.success && res.customToken) {
        signInWithCustomToken(clientAuth, res.customToken)
          .then(() => {
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
  }, [rawUserId]);

  // Listen for all unread messages belonging to this user
  useEffect(() => {
    if (!userId) return;
    const db = getDb();
    const chatsRef = collection(db, "supportChats");
    const q = query(chatsRef, where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      let sum = 0;
      const convs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      convs.forEach((c) => {
        sum += c.unreadByUser ?? 0;
      });

      setUnreadCount(sum);

      // Sound and visual notification logic
      if (isFirstRender.current) {
        prevConvsRef.current = convs;
        isFirstRender.current = false;
        
        // Mark all initial unread conversations so subsequent snapshots will not re-trigger them
        convs.forEach((c) => {
          if ((c.unreadByUser ?? 0) > 0) {
            const k = c.lastMessageAt?.toMillis ? c.lastMessageAt.toMillis() : (c.lastMessage || "init");
            notifiedKeysRef.current.add(`${c.id}-${k}`);
          }
        });

        // Trigger notification banner on initial page load / reload if unread messages exist (ONCE ONLY)
        if (sum > 0) {
          const unreadConv = convs.find((c) => (c.unreadByUser ?? 0) > 0) || convs[0];
          if (unreadConv) {
            const lastMsgKey = unreadConv.lastMessageAt?.toMillis ? unreadConv.lastMessageAt.toMillis() : (unreadConv.lastMessage || "init");
            const notifKey = `${unreadConv.id}-${lastMsgKey}`;
            
            setActiveNotification({
              id: notifKey,
              title: unreadConv.title || (unreadConv.type === "order" ? "Order Update" : "Support Chat"),
              message: `${sum} unread message${sum > 1 ? "s" : ""}: ${unreadConv.lastMessage || "New message received"}`,
              type: unreadConv.type || (unreadConv.id.startsWith("order-") ? "order" : "support"),
              chatId: unreadConv.id,
            });
            try {
              if (notifSoundRef.current) {
                notifSoundRef.current.currentTime = 0;
                notifSoundRef.current.play().catch(() => {});
              }
            } catch { /* silent */ }
          }
        }
        return;
      }

      convs.forEach((conv) => {
        const prevConv = prevConvsRef.current.find((p) => p.id === conv.id);
        const currentUnread = conv.unreadByUser ?? 0;
        const prevUnread = prevConv ? (prevConv.unreadByUser ?? 0) : 0;

        if (currentUnread > prevUnread) {
          const lastMsgKey = conv.lastMessageAt?.toMillis ? conv.lastMessageAt.toMillis() : (conv.lastMessage || "new");
          const notifKey = `${conv.id}-${lastMsgKey}`;
          const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

          if ((!isOpen || isMobile) && !notifiedKeysRef.current.has(notifKey)) {
            notifiedKeysRef.current.add(notifKey);
            // Play notification sound
            try {
              if (notifSoundRef.current) {
                notifSoundRef.current.currentTime = 0;
                notifSoundRef.current.play().catch(() => {});
              }
            } catch { /* silent */ }

            // Trigger visual Toast notification
            setActiveNotification({
              id: notifKey,
              title: conv.title || (conv.type === "order" ? "Order Update" : "Support Chat"),
              message: conv.lastMessage || "New message received",
              type: conv.type || (conv.id.startsWith("order-") ? "order" : "support"),
              chatId: conv.id,
            });
          }
        }
      });

      prevConvsRef.current = convs;
    }, (error) => {
      console.warn("[ChatWidget] Firestore unread listener warning:", error.message);
    });
    return unsub;
  }, [userId, isOpen]);

  // Auto-close notification toast after exactly 5 seconds if not dismissed by user
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [activeNotification]);

  // Click outside to close handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Conditional rendering
  const isOnConsolePage = pathname?.startsWith("/console");
  const isOnChatPage = pathname === "/chat";
  if (!userId || isOnConsolePage || (isOnChatPage && rawUserId)) return null;

  return (
    <>
      {/* Visual Toast Notification Banner */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            onClick={() => {
              console.log(`[ChatWidget] 🔔 Toast Notification Clicked | ChatId: ${activeNotification.chatId}`);
              if (window.innerWidth < 768) {
                window.location.href = `/chat?chatId=${activeNotification.chatId}`;
              } else {
                setIsOpen(true);
                setActiveNotification(null);
              }
            }}
            className="fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-[100] sm:max-w-sm w-auto bg-white/95 dark:bg-[#121217]/95 border border-zinc-200/80 dark:border-white/10 p-4 rounded-2xl shadow-2xl flex gap-3.5 pointer-events-auto cursor-pointer backdrop-blur-xl transition-all hover:scale-[1.01]"
          >
            <div className="shrink-0">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center border shadow-xs",
                activeNotification.type === "order"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                  : "bg-[#6133e1]/10 text-[#6133e1] dark:text-violet-400 border-[#6133e1]/20"
              )}>
                {activeNotification.type === "order" ? (
                  <ShoppingBag className="h-5 w-5" />
                ) : (
                  <MessageSquare className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-[#6133e1]" />
                  New Message
                </span>
              </div>
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {activeNotification.title}
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                {activeNotification.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("[ChatWidget] ✖️ Dismiss Toast Notification Clicked");
                setActiveNotification(null);
              }}
              aria-label="Close notification"
              className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer bg-transparent border-none shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isOpen && (
        <button
          ref={buttonRef}
          id="chat-widget-toggle"
          onClick={() => {
            console.log(`[ChatWidget] 💬 Floating Chat Toggle Button Clicked | User: ${userId} | UnreadCount: ${unreadCount}`);
            if (window.innerWidth < 768) {
              window.location.href = "/chat";
            } else {
              setIsOpen(true);
            }
          }}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-2xl bg-[#6133e1] hover:bg-[#5028c7] shadow-xl shadow-[#6133e1]/30 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-[#0c0c10] shadow-sm animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="chat-widget-panel"
          className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[400px] h-[580px] flex flex-col rounded-2xl border border-zinc-200/80 dark:border-white/10 bg-white dark:bg-[#0c0c10] shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          <UserChatPanel isFullScreen={false} onClose={() => {
            console.log("[ChatWidget] ❌ User Closed Chat Panel");
            setIsOpen(false);
          }} />
        </div>
      )}
    </>
  );
}
