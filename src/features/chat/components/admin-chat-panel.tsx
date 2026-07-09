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
  limit,
  getDocs,
  where,
} from "firebase/firestore";
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

      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadByUser: (activeUser?.unreadByUser ?? 0) + 1,
      });
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
    <div className="flex h-[calc(100vh-8rem)] max-h-[800px] rounded-2xl border border-zinc-200 dark:border-white/[0.05] overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
      
      {/* LEFT PANE: Inbox */}
      <div className="w-72 shrink-0 flex flex-col border-r border-zinc-200 dark:border-white/[0.05] bg-zinc-50/50 dark:bg-zinc-900/30">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white leading-none">Support Inbox</h2>
                <p className="text-[10px] text-zinc-500 mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {totalUnread > 0 && (
              <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center">
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
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/[0.06] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none focus:border-violet-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
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
              <Users className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
              <p className="text-xs text-zinc-400">
                {searchQuery ? "No users found" : "No conversations yet"}
              </p>
            </div>
          )}

          {filteredConvs.map((conv) => (
            <button
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.03] transition-colors cursor-pointer ${
                activeUserId === conv.id
                  ? "bg-violet-50 dark:bg-violet-500/[0.07] border-l-2 border-l-violet-500"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Avatar */}
                  <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black uppercase">
                    {(conv.username || conv.email || "?")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
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
                    <span className="h-4 w-4 rounded-full bg-violet-500 text-[9px] font-black text-white flex items-center justify-center">
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
      <div className="flex-1 flex flex-col min-w-0">
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Select a conversation</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-[240px]">
                Choose a user from the inbox to view their messages and reply in real-time.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-white/[0.05] flex items-center gap-3 bg-white dark:bg-zinc-950">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-black uppercase shrink-0">
                {(activeUser?.username || activeUser?.email || "?")[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                  {activeUser?.username || "Unknown User"}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">{activeUser?.email}</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
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
                    className={`max-w-[72%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "admin"
                        ? "bg-[#6133e1] text-white rounded-br-sm"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-zinc-400">
                      {msg.sender === "user" ? (activeUser?.username || "User") : "You"} · {formatMessageTime(msg.timestamp)}
                    </span>
                    {msg.sender === "admin" && (
                      <CheckCheck className="h-3 w-3 text-zinc-400" />
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div className="px-4 py-3 border-t border-zinc-100 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-zinc-950">
              <input
                ref={inputRef}
                id="admin-chat-reply-input"
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Reply to ${activeUser?.username || "user"}…`}
                disabled={isSending}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800/70 text-zinc-900 dark:text-white placeholder:text-zinc-400 rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-violet-500/50 transition-colors disabled:opacity-50"
              />
              <button
                id="admin-chat-reply-send"
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSending}
                className="h-9 w-9 rounded-xl bg-[#6133e1] hover:bg-[#5028c7] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                aria-label="Send reply"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
