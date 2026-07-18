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
import { MessageCircle, MessageSquare, ShoppingBag, X } from "lucide-react";
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

  const userId = (session?.user as any)?.id as string | undefined;

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const prevConvsRef = useRef<any[]>([]);
  const isFirstRender = useRef(true);
  const notifSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    notifSoundRef.current = new Audio("/audio/sound-7(1).mp3");
    if (notifSoundRef.current) {
      notifSoundRef.current.preload = "auto";
      notifSoundRef.current.volume = 0.6;
    }
  }, []);

  // Sign in to Firebase Auth using NextAuth session ID
  useEffect(() => {
    if (!clientAuth || !userId) {
      setIsAuthReady(false);
      return;
    }

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

  // Listen for all unread messages belonging to this user
  useEffect(() => {
    if (!userId || !isAuthReady) return;
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
        return;
      }

      convs.forEach((conv) => {
        const prevConv = prevConvsRef.current.find((p) => p.id === conv.id);
        const currentUnread = conv.unreadByUser ?? 0;
        const prevUnread = prevConv ? (prevConv.unreadByUser ?? 0) : 0;

        if (currentUnread > prevUnread) {
          const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
          if (!isOpen || isMobile) {
            // Play notification sound
            try {
              if (notifSoundRef.current) {
                notifSoundRef.current.currentTime = 0;
                notifSoundRef.current.play().catch(() => {});
              }
            } catch { /* silent */ }

            // Trigger visual Toast notification
            setActiveNotification({
              id: Math.random().toString(),
              title: conv.title || (conv.type === "order" ? "Order Update" : "Support Chat"),
              message: conv.lastMessage || "New message received",
              type: conv.type || (conv.id.startsWith("order-") ? "order" : "support"),
              chatId: conv.id,
            });
          }
        }
      });

      prevConvsRef.current = convs;
    });
    return unsub;
  }, [userId, isOpen]);

  // Auto-close notification toast after 6 seconds
  useEffect(() => {
    if (!activeNotification) return;
    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 6000);
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
  if (!session?.user || !userId || isOnConsolePage || isOnChatPage) return null;

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
              if (window.innerWidth < 768) {
                window.location.href = `/chat?chatId=${activeNotification.chatId}`;
              } else {
                setIsOpen(true);
                setActiveNotification(null);
              }
            }}
            className="fixed top-6 right-6 z-[100] max-w-sm w-full bg-white/90 dark:bg-zinc-950/95 border border-zinc-200 dark:border-white/[0.08] p-4 rounded-2xl shadow-2xl flex gap-3 pointer-events-auto cursor-pointer backdrop-blur-md"
          >
            <div className="shrink-0">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center border",
                activeNotification.type === "order"
                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20"
              )}>
                {activeNotification.type === "order" ? (
                  <ShoppingBag className="h-5 w-5" />
                ) : (
                  <MessageSquare className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-550 tracking-wider block mb-0.5">
                New Message
              </span>
              <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">
                {activeNotification.title}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                {activeNotification.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveNotification(null);
              }}
              aria-label="Close notification"
              className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer bg-transparent border-none shrink-0"
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
            if (window.innerWidth < 768) {
              window.location.href = "/chat";
            } else {
              setIsOpen(true);
            }
          }}
          aria-label="Open support chat"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#6133e1] hover:bg-[#5028c7] shadow-lg shadow-violet-500/30 flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 cursor-pointer"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-white dark:border-black">
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
          className="fixed bottom-6 right-6 z-50 w-[340px] sm:w-[380px] h-[560px] flex flex-col rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d0d12] shadow-2xl shadow-black/30 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          <UserChatPanel isFullScreen={false} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
}
