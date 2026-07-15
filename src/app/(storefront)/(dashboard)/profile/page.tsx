import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { ProfileForm } from "./profile-form";
import { User as UserIcon, Shield, Mail, Send, Globe } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function UserProfilePage() {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          Account Profile
        </h1>
        <p className="text-xs text-zinc-550 dark:text-zinc-400">
          View your registered trainer settings and communication handles.
        </p>
      </div>

      {/* Info Card */}
      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-6 shadow-xs text-left">
        <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-white/[0.06] pb-5">
          <div className="h-10 w-10 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">{user.name}</h3>
            <span className="inline-flex items-center gap-1 bg-zinc-50 dark:bg-white/[0.04] text-zinc-900 dark:text-white px-2 py-0.5 rounded-md text-[9px] font-semibold border border-zinc-200 dark:border-white/[0.08] mt-1 uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              {user.role}
            </span>
          </div>
        </div>

        {/* Dense info rows */}
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-zinc-200 dark:border-white/[0.06]">
            <span className="text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
              <UserIcon className="h-3.5 w-3.5" /> Username
            </span>
            <span className="font-semibold text-zinc-900 dark:text-white">{user.username || "Not assigned"}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-200 dark:border-white/[0.06]">
            <span className="text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
              <Mail className="h-3.5 w-3.5" /> Email
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-white">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-zinc-200 dark:border-white/[0.06]">
            <span className="text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
              <Send className="h-3.5 w-3.5" /> Telegram Handle
            </span>
            <span className="font-semibold text-zinc-900 dark:text-white">
              {user.telegramUsername || "None configured"}
            </span>
          </div>

          {user.country && (
            <div className="flex items-center justify-between py-1 border-b border-zinc-200 dark:border-white/[0.06]">
              <span className="text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5 font-medium">
                <Globe className="h-3.5 w-3.5" /> Country
              </span>
              <span className="font-semibold text-zinc-900 dark:text-white">{user.country}</span>
            </div>
          )}
        </div>

        {/* Interactive Update Handle Form */}
        <div className="pt-4 border-t border-zinc-200 dark:border-white/[0.06]">
          <ProfileForm currentTelegram={user.telegramUsername || ""} />
        </div>
      </div>
    </div>
  );
}
