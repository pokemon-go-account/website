import { AdminChatPanel } from "@/features/chat/components/admin-chat-panel";

export default function ConsoleChatPage() {
  return (
    <div className="max-w-7xl space-y-6 flex-1 flex flex-col min-h-0">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.06] pb-5 shrink-0">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Support Chat</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Real-time conversations with users — messages sync instantly.
        </p>
      </div>

      {/* Chat Panel */}
      <AdminChatPanel />
    </div>
  );
}
