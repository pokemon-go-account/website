import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { VerifyOtpForm } from "./verify-otp-form";

export const revalidate = 0; // Dynamic route

export default async function VerifyOtpPage() {
  const session = await auth();

  // If not logged in, redirect to login
  if (!session?.user) {
    redirect("/login");
  }

  // If already verified, redirect away to profile complete or auctions
  if ((session.user as any).isEmailVerified) {
    if ((session.user as any).isOnboarded) {
      redirect("/auctions");
    } else {
      redirect("/profile/complete");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white px-4 py-16 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="relative w-full max-w-md space-y-6 border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-8 rounded-lg shadow-xs transition-colors duration-300 text-left">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            Verify Your Email
          </h2>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
            We sent a verification code to <span className="font-semibold text-zinc-800 dark:text-zinc-250">{session.user.email}</span>. Please enter it below to activate your account.
          </p>
        </div>

        <VerifyOtpForm />
      </div>
    </div>
  );
}
