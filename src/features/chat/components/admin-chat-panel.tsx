"use client";

import { useState, useEffect, useRef } from "react";
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
  getDocs,
  where,
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
  Clock,
  ChevronLeft,
} from "lucide-react";

interface ChatMeta {
  id: string; // userId
  username: string;
  email: string;
  lastMessage: string;
  lastMessageAt: any;
  unreadByAdmin: number;
  unreadByUser: number;
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "admin";
  senderName: string;
  timestamp: any;
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
  const [filteredConvs, setFilteredConvs] = useState<ChatMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<ChatMeta | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const autoSelectedRef = useRef(false);

  // Auto-select user from query params
  useEffect(() => {
    if (queryUserId && !autoSelectedRef.current) {
      const existing = conversations.find((c) => c.id === queryUserId);
      if (existing) {
        setActiveUserId(existing.id);
        setActiveUser(existing);
        autoSelectedRef.current = true;
      } else if (queryUsername && queryEmail) {
        const tempChat: ChatMeta = {
          id: queryUserId,
          username: queryUsername,
          email: queryEmail,
          lastMessage: "",
          lastMessageAt: null,
          unreadByAdmin: 0,
          unreadByUser: 0,
        };
        setActiveUserId(queryUserId);
        setActiveUser(tempChat);
        autoSelectedRef.current = true;
      }
    }
  }, [queryUserId, conversations, queryUsername, queryEmail]);

  // Load all conversations (real-time)
  useEffect(() => {
    const db = getDb();
    const chatsRef = collection(db, "supportChats");
    const q = query(chatsRef, orderBy("lastMessageAt", "desc"), limit(100));

    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMeta, "id">),
      }));
      setConversations(convs);
    });

    return unsub;
  }, []);

  // Filter conversations by search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConvs(conversations);
      return;
    }
    const q = searchQuery.toLowerCase();
    setFilteredConvs(
      conversations.filter(
        (c) =>
          c.username?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, conversations]);

  // Load messages for active conversation (real-time)
  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      return;
    }

    const db = getDb();
    const msgsRef = collection(db, "supportChats", activeUserId, "messages");
    const q = query(msgsRef, orderBy("timestamp", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Message, "id">),
      }));
      setMessages(msgs);

      // Mark as read by admin
      const chatRef = doc(db, "supportChats", activeUserId);
      updateDoc(chatRef, { unreadByAdmin: 0 }).catch(() => {});
    });

    return unsub;
  }, [activeUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (conv: ChatMeta) => {
    setActiveUserId(conv.id);
    setActiveUser(conv);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendReply = async () => {
    const text = replyText.trim();
    if (!text || isSending || !activeUserId) return;
    setIsSending(true);
    setReplyText("");

    try {
      const db = getDb();
      const msgsRef = collection(db, "supportChats", activeUserId, "messages");
      const chatRef = doc(db, "supportChats", activeUserId);

      await addDoc(msgsRef, {
        text,
        sender: "admin",
        senderName: "Support Team",
        timestamp: serverTimestamp(),
        read: false,
      });

      await setDoc(chatRef, {
        username: activeUser?.username || "Unknown User",
        email: activeUser?.email || "",
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadByUser: (activeUser?.unreadByUser ?? 0) + 1,
        unreadByAdmin: 0,
      }, { merge: true });
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

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadByAdmin ?? 0), 0);

  return (
    <div className="flex flex-1 min-h-0 rounded-lg border border-zinc-200 dark:border-white/[0.06] overflow-hidden bg-white dark:bg-[#111111] shadow-xs">
      
      {/* LEFT PANE: Inbox */}
      <div className={`w-full md:w-72 shrink-0 flex flex-col border-r border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-black/10 ${activeUserId ? "hidden md:flex" : "flex"}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">Support Inbox</h2>
              <p className="text-[10px] text-zinc-500 mt-1">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
            </div>
            {totalUnread > 0 && (
              <span className="h-5 min-w-5 px-1.5 rounded-md bg-zinc-900 dark:bg-white text-[10px] font-semibold text-white dark:text-black flex items-center justify-center">
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
              placeholder="Search by username…"
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

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <Users className="h-8 w-8 text-zinc-350 dark:text-zinc-650" />
              <p className="text-xs text-zinc-400">
                {searchQuery ? "No users found" : "No conversations yet"}
              </p>
            </div>
          )}

          {filteredConvs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-white/[0.03] hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${
                activeUserId === conv.id
                  ? "bg-zinc-50 dark:bg-white/[0.04]"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar */}
                  <div className="h-8 w-8 shrink-0 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-900 dark:text-white text-[11px] font-semibold uppercase">
                    {(conv.username || conv.email || "?")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {conv.username || conv.email || "Unknown User"}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                      {conv.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[9px] text-zinc-400">{formatTime(conv.lastMessageAt)}</span>
                  {(conv.unreadByAdmin ?? 0) > 0 && (
                    <span className="h-4 w-4 rounded-md bg-zinc-900 dark:bg-white text-[9px] font-semibold text-white dark:text-black flex items-center justify-center">
                      {conv.unreadByAdmin > 9 ? "9+" : conv.unreadByAdmin}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANE: Conversation Thread */}
      <div className={`flex-1 flex flex-col min-w-0 ${activeUserId ? "flex" : "hidden md:flex"}`}>
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="h-16 w-16 rounded-lg bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/[0.06] flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-zinc-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Select a conversation</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-[240px]">
                Choose a user from the inbox to view their messages and reply in real-time.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.06] flex items-center gap-3 bg-white dark:bg-[#111111]">
              <button
                type="button"
                onClick={() => { setActiveUserId(null); setActiveUser(null); }}
                className="md:hidden mr-1 p-1 -ml-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                aria-label="Back to inbox"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-900 dark:text-white text-xs font-semibold uppercase shrink-0">
                {(activeUser?.username || activeUser?.email || "?")[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                  {activeUser?.username || "Unknown User"}
                </p>
                <p className="text-[10px] text-zinc-550 dark:text-zinc-400 truncate">{activeUser?.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-zinc-50/20 dark:bg-black/5">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-zinc-400">No messages yet in this conversation.</p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${msg.sender === "admin" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[72%] px-3.5 py-1.5 rounded-md text-xs leading-relaxed border ${
                      msg.sender === "admin"
                        ? "bg-zinc-900 dark:bg-white border-zinc-950 dark:border-zinc-100 text-white dark:text-zinc-900"
                        : "bg-white dark:bg-[#151515] border-zinc-200 dark:border-white/[0.06] text-zinc-900 dark:text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-zinc-500">
                      {msg.sender === "user" ? (activeUser?.username || "User") : "You"} · {formatMessageTime(msg.timestamp)}
                    </span>
                    {msg.sender === "admin" && (
                      <CheckCheck className="h-3 w-3 text-zinc-455 dark:text-zinc-500" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div className="px-4 py-3 border-t border-zinc-200 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-[#111111]">
              <input
                ref={inputRef}
                id="admin-chat-reply-input"
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Reply to ${activeUser?.username || "user"}…`}
                disabled={isSending}
                className="flex-1 bg-zinc-50 dark:bg-[#151515] text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-md px-3 h-8 text-xs outline-none border border-zinc-200 dark:border-white/[0.08] focus:border-zinc-400 dark:focus:border-white transition-colors disabled:opacity-50"
              />
              <button
                id="admin-chat-reply-send"
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSending}
                className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 font-semibold text-xs"
                aria-label="Send reply"
              >
                {isSending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Send Reply"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
