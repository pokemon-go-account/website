import Link from "next/link";
import { LoginForm } from "./login-form";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { AuthHeader } from "@/features/auth/components/auth-header";
import { CheckCircle2 } from "lucide-react";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isRegistered = params.registered === "true";
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return (
    <AuthLayout>
      <AuthHeader
        title="Welcome back"
        description="Sign in to continue to your account."
      />

      {isRegistered && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">
            Account created successfully. Please sign in with your credentials.
          </span>
        </div>
      )}

      <LoginForm callbackUrl={callbackUrl} />

      <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2 text-center">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?
        </p>
        <Link
          href="/signup"
          className="inline-flex w-full h-9.5 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-zinc-900 dark:hover:bg-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
        >
          Sign up for free
        </Link>
      </div>
    </AuthLayout>
  );
}
