import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserChatPanel } from "@/features/chat/components/user-chat-panel";
import { getGuestSessionAction } from "@/features/auth/guest-actions";

export const revalidate = 0;

interface ChatPageProps {
  searchParams: Promise<{
    chatId?: string;
  }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const session = await auth();
  let guestSession = null;

  if (!session?.user || !session.user.id) {
    guestSession = await getGuestSessionAction();
    if (!guestSession) {
      redirect("/login");
    }
  }

  const resolvedSearchParams = await searchParams;
  const chatId = resolvedSearchParams.chatId || null;

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-black/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            Live Workspaces
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Coordinate manual payments and open support tickets.
          </p>
        </div>

        <UserChatPanel isFullScreen={true} initialChatId={chatId} guestSession={guestSession} />
      </div>
    </div>
  );
}
