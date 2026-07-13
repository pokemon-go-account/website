import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthErrorPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "Default";

  // Map NextAuth error codes to user-friendly messages
  const errorMap: Record<string, { title: string; message: string }> = {
    Configuration: {
      title: "Server Configuration Error",
      message: "The server is missing environment variables or database configurations. If you are the owner, please check your Vercel project settings.",
    },
    AccessDenied: {
      title: "Access Denied",
      message: "You do not have permission to sign in, or your account may have been suspended by the administration.",
    },
    Verification: {
      title: "Verification Link Expired",
      message: "The authentication or verification link is invalid or has expired. Please try signing in again to request a new link.",
    },
    Default: {
      title: "Authentication Failed",
      message: "An unexpected error occurred during the authentication process. Please try again.",
    },
  };

  const { title, message } = errorMap[error] || errorMap.Default;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white px-4 py-16 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="relative w-full max-w-md space-y-6 border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-8 rounded-lg shadow-xs transition-colors duration-300 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-red-500/10 border border-red-500/20 text-red-500 mb-2">
          {error === "AccessDenied" ? (
            <ShieldAlert className="h-6 w-6" />
          ) : (
            <AlertTriangle className="h-6 w-6" />
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">{title}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{message}</p>
        </div>

        {/* Error Code Tag */}
        <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
          Error Code: {error}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/login"
            className="w-full h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
          <Link
            href="/"
            className="w-full h-8 px-4 rounded-md text-xs font-semibold text-zinc-550 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer flex items-center justify-center"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
