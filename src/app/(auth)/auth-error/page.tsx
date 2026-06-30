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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 border border-border bg-card/30 backdrop-blur-sm p-8 rounded-xl shadow-2xl text-center">
        {/* Error Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20 text-destructive mb-2">
          {error === "AccessDenied" ? (
            <ShieldAlert className="h-7 w-7" />
          ) : (
            <AlertTriangle className="h-7 w-7" />
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>

        {/* Error Code Tag */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted border border-border px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Error Code: {error}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold active:scale-[0.98] transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700/50"
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Sign In
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "w-full h-9 inline-flex items-center justify-center rounded-lg text-xs font-semibold hover:bg-muted/50 text-muted-foreground transition-all cursor-pointer"
            )}
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
