"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  setDoc,
  updateDoc,
  increment,
  getDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firestore";
import { MessageCircle, ChevronDown, Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "admin";
  senderName: string;
  timestamp: any;
}

export function ChatWidget() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userId = (session?.user as any)?.id as string | undefined;
  const username =
    (session?.user as any)?.username ||
    session?.user?.name ||
    session?.user?.email ||
    "User";

  // Listen for real-time messages — always called, skips when no userId
  useEffect(() => {
    if (!userId) return;
    const db = getDb();
    const msgsRef = collection(db, "supportChats", userId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Message, "id">) }))
      );
    });
    return unsub;
  }, [userId]);

  // Listen for unread count — always called
  useEffect(() => {
    if (!userId) return;
    const db = getDb();
    const chatRef = doc(db, "supportChats", userId);
    const unsub = onSnapshot(chatRef, (snap) => {
      if (snap.exists()) setUnreadCount(snap.data()?.unreadByUser ?? 0);
    });
    return unsub;
  }, [userId]);

  // Scroll to bottom when messages change — always called
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  // --- Conditional rendering (after ALL hooks) ---
  const isOnConsolePage = pathname?.startsWith("/console");
  if (!session?.user || !userId || isOnConsolePage) return null;

  // ---

  function formatTime(ts: any) {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const handleOpen = async () => {
    setIsOpen(true);
    setUnreadCount(0);
    try {
      const db = getDb();
      await updateDoc(doc(db, "supportChats", userId), { unreadByUser: 0 });
    } catch { /* doc may not exist yet */ }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setIsSending(true);
    setInputText("");

    try {
      const db = getDb();
      const chatRef = doc(db, "supportChats", userId);
      const msgsRef = collection(db, "supportChats", userId, "messages");

      const snap = await getDoc(chatRef);
      if (!snap.exists()) {
        await setDoc(chatRef, {
          userId,
          username,
          email: session?.user?.email ?? "",
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 1,
          unreadByUser: 0,
        });
      } else {
        await updateDoc(chatRef, {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: increment(1),
          username,
          email: session?.user?.email ?? "",
        });
      }

      await addDoc(msgsRef, {
        text,
        sender: "user",
        senderName: username,
        timestamp: serverTimestamp(),
        read: false,
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

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="chat-widget-toggle"
          onClick={handleOpen}
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
          id="chat-widget-panel"
          className="fixed bottom-6 right-6 z-50 w-[340px] sm:w-[380px] max-h-[560px] flex flex-col rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0d0d12] shadow-2xl shadow-black/30 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#6133e1] text-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">Support Chat</p>
                <p className="text-[10px] text-violet-200 mt-0.5">We reply as fast as possible</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
              aria-label="Close chat"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[260px] max-h-[380px]">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-8">
                <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">How can we help?</p>
                  <p className="text-xs text-zinc-500 mt-1 max-w-[220px]">
                    Send us a message and our team will respond shortly.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#6133e1] text-white rounded-br-sm"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-zinc-400 px-1">
                  {msg.sender === "admin" ? "Support · " : ""}
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-[#0d0d12]">
            <input
              ref={inputRef}
              id="chat-widget-input"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              disabled={isSending}
              autoFocus
              className="flex-1 bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-violet-500/50 transition-colors disabled:opacity-50"
            />
            <button
              id="chat-widget-send"
              onClick={handleSend}
              disabled={!inputText.trim() || isSending}
              className="h-9 w-9 rounded-xl bg-[#6133e1] hover:bg-[#5028c7] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
