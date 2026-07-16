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
import { MessageCircle } from "lucide-react";
import { UserChatPanel } from "./user-chat-panel";

export function ChatWidget() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const userId = (session?.user as any)?.id as string | undefined;

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const prevUnreadCountRef = useRef(0);
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

  // Listen for all unread messages belonging to this user
  useEffect(() => {
    if (!userId) return;
    const db = getDb();
    const chatsRef = collection(db, "supportChats");
    const q = query(chatsRef, where("userId", "==", userId));
    const unsub = onSnapshot(q, (snap) => {
      let sum = 0;
      snap.docs.forEach((doc) => {
        sum += doc.data()?.unreadByUser ?? 0;
      });
      setUnreadCount(sum);
    });
    return unsub;
  }, [userId]);

  // Play notification sound when unreadCount increases and panel is closed/on mobile
  useEffect(() => {
    if (isFirstRender.current) {
      prevUnreadCountRef.current = unreadCount;
      isFirstRender.current = false;
      return;
    }

    if (unreadCount > prevUnreadCountRef.current) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      if (!isOpen || isMobile) {
        try {
          if (notifSoundRef.current) {
            notifSoundRef.current.currentTime = 0;
            notifSoundRef.current.play().catch(() => {});
          }
        } catch { /* silent */ }
      }
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, isOpen]);

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
