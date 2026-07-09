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
    <div className="mx-auto max-w-md px-4 py-24 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-md p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
            Verify Your Email
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We sent a verification code to <span className="font-semibold text-foreground">{session.user.email}</span>. Please enter it below to activate your account.
          </p>
        </div>

        <VerifyOtpForm />
      </div>
    </div>
  );
}
