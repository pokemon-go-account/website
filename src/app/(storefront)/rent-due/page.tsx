import Link from "next/link";
import { Banknote } from "lucide-react";

export default function RentDuePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white px-4">
      <div className="max-w-sm w-full rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-8 space-y-5 text-center shadow-xs">
        <div className="h-12 w-12 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center mx-auto">
          <Banknote className="h-5 w-5 text-zinc-550 dark:text-zinc-400" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-zinc-900 dark:text-white">Access Suspended</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Your ADMIN access has been paused due to an outstanding weekly rent payment.
            Please contact the platform administrator via Telegram to resolve this.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold items-center justify-center cursor-pointer active:scale-[0.98] transition-all"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
