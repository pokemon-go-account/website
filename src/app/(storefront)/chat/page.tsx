import { UserChatPanel } from "@/features/chat/components/user-chat-panel";

export const revalidate = 0;

interface ChatPageProps {
  searchParams: Promise<{
    chatId?: string;
    ticketId?: string;
  }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const resolvedSearchParams = await searchParams;
  const chatId = resolvedSearchParams.chatId || resolvedSearchParams.ticketId || null;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black/10">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-3 sm:space-y-6">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Live Workspaces
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 sm:mt-1">
            Coordinate manual payments and open support tickets.
          </p>
        </div>

        <UserChatPanel isFullScreen={true} initialChatId={chatId} />
      </div>
    </div>
  );
}
