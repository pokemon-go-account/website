import Link from "next/link";
import { RegisterForm } from "./register-form";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { AuthHeader } from "@/features/auth/components/auth-header";

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthHeader
        title="Create your account"
        description="Get started with your free account today."
      />

      <RegisterForm />

      <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2 text-center">
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Already have an account?
        </p>
        <Link
          href="/login"
          className="inline-flex w-full h-9.5 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 hover:bg-zinc-200/70 dark:bg-zinc-900 dark:hover:bg-zinc-800/90 text-xs font-bold text-zinc-900 dark:text-zinc-100 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}