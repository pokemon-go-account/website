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
    <div className="relative flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-16 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background Decorative Auras */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 border border-white/5 bg-[#121215]/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl shadow-black/50">
        
        {/* Elegant top badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
            <Sparkles className="h-3 w-3" />
            Gaming Marketplace
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
          <p className="text-sm text-zinc-400">Enter your coordinates to access auctions</p>
        </div>

        {isRegistered && (
          <div className="rounded-xl bg-emerald-500/10 p-3.5 text-xs text-emerald-400 border border-emerald-500/20 text-center leading-normal">
            ✨ Registration successful! Please sign in with your password below.
          </div>
        )}

        <LoginForm callbackUrl={callbackUrl} />

        <div className="text-center pt-2">
          <p className="text-xs text-zinc-500">
            Don&apos;t have a coordinates key?{" "}
            <Link href="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline underline-offset-4 transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
