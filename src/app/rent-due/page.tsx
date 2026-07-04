import Link from "next/link";
import { Banknote } from "lucide-react";

export default function RentDuePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white px-4">
      <div className="max-w-sm w-full rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 space-y-5 text-center">
        <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Banknote className="h-7 w-7 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white">Access Suspended</h1>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Your ADMIN access has been paused due to an outstanding weekly rent payment.
            Please contact the platform administrator via Telegram to resolve this.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block h-9 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold leading-9 cursor-pointer active:scale-95 transition-all"
        >
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
