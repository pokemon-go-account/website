import Link from "next/link";
import { RegisterForm } from "./register-form";
import { Sparkles } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white px-4 py-16 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="relative w-full max-w-md space-y-6 border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-8 rounded-lg shadow-xs transition-colors duration-300 text-left">
        
        {/* Elegant top badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            Gaming Marketplace
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Create Coordinates</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Launch your trainer profile and begin trading</p>
        </div>

        <RegisterForm />

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Already registered your key?{" "}
            <Link href="/login" className="text-zinc-900 dark:text-white font-semibold hover:underline underline-offset-4 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}