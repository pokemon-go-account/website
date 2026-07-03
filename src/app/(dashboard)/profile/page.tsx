import { auth } from "@/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { ProfileForm } from "./profile-form";
import { User as UserIcon, Shield, Mail, Send } from "lucide-react";

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
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
          Account Profile
        </h1>
        <p className="text-xs text-muted-foreground">
          View your registered trainer settings and communication handles.
        </p>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-sm p-6 space-y-6 shadow-sm">
        <div className="flex items-center gap-4 border-b border-border/60 pb-5">
          <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-700/50 flex items-center justify-center text-white">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">{user.name}</h3>
            <span className="inline-flex items-center gap-1 bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[10px] font-bold border border-zinc-700 mt-1 uppercase tracking-wider">
              <Shield className="h-3 w-3" />
              {user.role}
            </span>
          </div>
        </div>

        {/* Dense info rows */}
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-border/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" /> Username
            </span>
            <span className="font-semibold text-indigo-400">{user.username || "Not assigned"}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Email
            </span>
            <span className="font-medium text-foreground">{user.email}</span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/30">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5" /> Telegram Handle
            </span>
            <span className="font-medium text-zinc-300">
              {user.telegramUsername || "None configured"}
            </span>
          </div>
        </div>

        {/* Interactive Update Handle Form */}
        <div className="pt-4 border-t border-border/60">
          <ProfileForm currentTelegram={user.telegramUsername || ""} />
        </div>
      </div>
    </div>
  );
}
