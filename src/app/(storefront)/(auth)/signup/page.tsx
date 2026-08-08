import Link from "next/link";
import { RegisterForm } from "../register/register-form";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { AuthHeader } from "@/features/auth/components/auth-header";

export default function SignUpPage() {
  return (
    <AuthLayout>
      <AuthHeader
        title="Create your account"
        description="Get started with your free account today."
      />

      <RegisterForm />

      <div className="pt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 rounded"
        >
          Sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
