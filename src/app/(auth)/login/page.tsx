import Link from "next/link";
import { LoginForm } from "./login-form";

interface LoginPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const isRegistered = params.registered === "true";
  const callbackUrl = typeof params.callbackUrl === "string" ? params.callbackUrl : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-6 border border-border bg-card p-6 sm:p-8 rounded-xl shadow-2xl">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sign in to your account</h1>
          <p className="text-sm text-muted-foreground">Enter details below to access your auctions dashboard</p>
        </div>

        {isRegistered && (
          <div className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-center">
            Registration successful! Please sign in below.
          </div>
        )}

        <LoginForm callbackUrl={callbackUrl} />

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4 hover:text-white transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
