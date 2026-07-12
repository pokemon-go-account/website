import Link from "next/link";
import { LoginForm } from "./login-form";
import { Sparkles } from "lucide-react";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isRegistered = params.registered === "true";
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

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
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Welcome Back</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter your coordinates to access auctions</p>
        </div>

        {isRegistered && (
          <div className="rounded-md bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 text-center leading-normal">
            ✨ Registration successful! Please sign in with your password below.
          </div>
        )}

        <LoginForm callbackUrl={callbackUrl} />

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Don&apos;t have a coordinates key?{" "}
            <Link href="/register" className="text-zinc-900 dark:text-white font-semibold hover:underline underline-offset-4 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
