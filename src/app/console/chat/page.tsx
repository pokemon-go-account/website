import { MessageCircle } from "lucide-react";
import { AdminChatPanel } from "@/features/chat/components/admin-chat-panel";

export default function ConsoleChatPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="border-b border-zinc-200 dark:border-white/[0.05] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-violet-500 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white">Support Chat</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Real-time conversations with users — messages sync instantly
            </p>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <AdminChatPanel />
    </div>
  );
}
